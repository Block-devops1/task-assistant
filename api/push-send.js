// api/push-send.js — Vercel Serverless Function (Cron Job)
// Runs every hour via vercel.json cron schedule.
// Checks each subscribed user's local time and fires the right notification:
//   1. Daily reminder  — if it's their chosen hour and they haven't logged today
//   2. Streak alert    — if they had a streak and haven't logged by their hour
//   3. Weekly report   — every Sunday at their reminder hour
//
// Requires:
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_MAILTO  (generate with web-push)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   GROQ_API_KEY  (for weekly report Lambert summary)
//
// Generate VAPID keys once:
//   npx web-push generate-vapid-keys
// Then add them to Vercel environment variables.

import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_MAILTO || "mailto:you@example.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(timezone) {
  return new Date().toLocaleDateString("en-CA", { timeZone: timezone }); // YYYY-MM-DD
}

function localHour(timezone) {
  return parseInt(
    new Date().toLocaleString("en", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    }),
  );
}

function isSunday(timezone) {
  return (
    new Date().toLocaleDateString("en", {
      timeZone: timezone,
      weekday: "long",
    }) === "Sunday"
  );
}

async function sendPush(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      // Subscription expired — clean it up
      return "expired";
    }
    console.error("Push send error:", err.message);
    return false;
  }
}

// ── Full weekly report via Groq — structured data + disruptor-break
// strategies + short push teaser, all generated once and stored ──

async function generateWeeklyReport(habits) {
  if (!process.env.GROQ_API_KEY) return null;

  const buildAgg = {},
    stopAgg = {};
  habits.forEach((h) => {
    if (h.habit_type === "continue") {
      buildAgg[h.subject] = (buildAgg[h.subject] || 0) + h.duration;
    } else {
      stopAgg[h.subject] = (stopAgg[h.subject] || 0) + h.duration;
    }
  });

  const topBuildList = Object.entries(buildAgg)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([subject, minutes]) => ({ subject, minutes }));
  const topDisruptorList = Object.entries(stopAgg)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([subject, minutes]) => ({ subject, minutes }));

  const totalBuild = Object.values(buildAgg).reduce((s, v) => s + v, 0);
  const totalStop = Object.values(stopAgg).reduce((s, v) => s + v, 0);

  const topBuildStr =
    topBuildList.map((d) => `${d.subject} ${d.minutes}m`).join(", ") ||
    "nothing";
  const topDisruptorStr =
    topDisruptorList.map((d) => `${d.subject} ${d.minutes}m`).join(", ") ||
    "none";

  if (!habits.length) {
    return {
      totalBuild: 0,
      totalStop: 0,
      topBuild: [],
      topDisruptors: [],
      lambertSummary:
        "No logs this week. Nothing to analyze because nothing happened.",
      pushTeaser: "No logs this week — start tomorrow.",
    };
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content:
              'You are Lambert, a sharp direct habit coach writing a weekly report. Respond ONLY with valid JSON, no markdown, no code fences, exactly this shape: {"summary": "3-5 sentence blunt analysis of the week, referencing specific numbers", "teaser": "one sentence under 140 characters for a push notification", "disruptorStrategies": [{"subject": "exact disruptor name", "strategy": "one concrete, specific action to interrupt or replace this habit next week, referencing one of the user\'s actual build habits as a replacement where relevant"}]}. Cover every disruptor listed, in the same order. If there are no disruptors, return an empty array for disruptorStrategies.',
          },
          {
            role: "user",
            content: `Week: Built ${totalBuild}m total (${topBuildStr}). Lost ${totalStop}m to disruptors (${topDisruptorStr}). Build habits available as replacements: ${topBuildStr}.`,
          },
        ],
      }),
    });
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "{}";
    const parsed = JSON.parse(raw.replace(/^```json\n?|\n?```$/g, ""));

    const strategyMap = {};
    (parsed.disruptorStrategies || []).forEach((d) => {
      strategyMap[d.subject] = d.strategy;
    });

    return {
      totalBuild,
      totalStop,
      topBuild: topBuildList,
      topDisruptors: topDisruptorList.map((d) => ({
        ...d,
        breakStrategy: strategyMap[d.subject] || null,
      })),
      lambertSummary:
        parsed.summary || `Built ${totalBuild}m, lost ${totalStop}m this week.`,
      pushTeaser: (
        parsed.teaser ||
        `Built ${totalBuild}m, lost ${totalStop}m. Review your week.`
      ).slice(0, 140),
    };
  } catch (err) {
    console.error("Weekly report generation failed:", err.message);
    return {
      totalBuild,
      totalStop,
      topBuild: topBuildList,
      topDisruptors: topDisruptorList.map((d) => ({
        ...d,
        breakStrategy: null,
      })),
      lambertSummary: `Built ${totalBuild}m, lost ${totalStop}m. Review and recalibrate for next week.`,
      pushTeaser: `Built ${totalBuild}m, lost ${totalStop}m this week.`,
    };
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Allow manual trigger via POST (for testing) or cron GET
  if (req.method !== "GET" && req.method !== "POST")
    return res.status(405).end();

  // ── Require a shared secret — this route sends real notifications and
  // burns Groq quota on the weekly report, so it can't be left public.
  // Your external scheduler (e.g. cron-job.org) must send this same
  // value as a header or query param. Set CRON_SECRET in Vercel env vars.
  const providedSecret =
    req.headers["x-cron-secret"] || req.query?.secret || req.body?.secret;
  if (!process.env.CRON_SECRET || providedSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Fetch all push subscriptions
  const { data: subs, error: subErr } = await supabase
    .from("push_subscriptions")
    .select("*");

  if (subErr) return res.status(500).json({ error: subErr.message });
  if (!subs?.length)
    return res.status(200).json({ sent: 0, message: "No subscribers" });

  const results = { daily: 0, streak: 0, weekly: 0, expired: 0, errors: 0 };
  const expiredUserIds = [];

  for (const sub of subs) {
    const tz = sub.timezone || "UTC";
    const hour = localHour(tz);
    const today = todayStr(tz);
    const sunday = isSunday(tz);
    const reminderHour = sub.reminder_hour ?? 20;

    // Only act at the user's configured reminder hour (±0, cron runs every hour)
    if (hour !== reminderHour) continue;

    // Fetch this user's recent habit logs (last 14 days)
    const since = new Date(Date.now() - 14 * 86400000).toISOString();
    const { data: logs } = await supabase
      .from("habit_logs")
      .select("subject, habit_type, duration, created_at")
      .eq("user_id", sub.user_id)
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    const todayLogs = (logs || []).filter(
      (l) => l.created_at?.slice(0, 10) === today,
    );
    const hasLoggedToday = todayLogs.length > 0;

    // ── 1. Weekly report (Sunday) ────────────────────────────────────────────
    if (sunday) {
      const weekStartDate = new Date(Date.now() - 7 * 86400000);
      const weekStart = weekStartDate.toISOString();
      const weekStartStr = weekStartDate.toISOString().slice(0, 10);
      const weekLogs = (logs || []).filter((l) => l.created_at >= weekStart);
      const report = await generateWeeklyReport(weekLogs);

      if (report) {
        // Compute week-over-week build delta against the prior stored report
        const { data: prevReport } = await supabase
          .from("weekly_reports")
          .select("build_total")
          .eq("user_id", sub.user_id)
          .order("week_start", { ascending: false })
          .limit(1)
          .maybeSingle();
        const weekOverWeekPct =
          prevReport && prevReport.build_total > 0
            ? Math.round(
                ((report.totalBuild - prevReport.build_total) /
                  prevReport.build_total) *
                  100,
              )
            : null;

        // Pull consistency/win-rate/streak from the same 14-day window we already fetched
        const uniqueDays = new Set(
          (logs || []).map((l) => l.created_at?.slice(0, 10)),
        ).size;
        const consistency = Math.min(100, Math.round((uniqueDays / 14) * 100));
        const byDay = {};
        (logs || []).forEach((l) => {
          const d = l.created_at?.slice(0, 10);
          if (!d) return;
          if (!byDay[d]) byDay[d] = { build: 0, stop: 0 };
          if (l.habit_type === "continue") byDay[d].build += l.duration;
          else byDay[d].stop += l.duration;
        });
        const days = Object.values(byDay);
        const winRate = days.length
          ? Math.round(
              (days.filter((d) => d.build > d.stop).length / days.length) * 100,
            )
          : 0;
        const efficiency =
          report.totalBuild + report.totalStop > 0
            ? Math.max(
                0,
                Math.round(
                  ((report.totalBuild - report.totalStop) /
                    (report.totalBuild + report.totalStop)) *
                    100,
                ),
              )
            : 0;

        await supabase.from("weekly_reports").upsert(
          [
            {
              user_id: sub.user_id,
              week_start: weekStartStr,
              build_total: report.totalBuild,
              stop_total: report.totalStop,
              efficiency,
              consistency,
              win_rate: winRate,
              streak: 0, // filled client-side where streak is already computed live
              week_over_week_pct: weekOverWeekPct,
              top_build: report.topBuild,
              top_disruptors: report.topDisruptors,
              lambert_summary: report.lambertSummary,
              push_teaser: report.pushTeaser,
            },
          ],
          { onConflict: "user_id,week_start" },
        );

        const result = await sendPush(sub.subscription, {
          title: "⚡ Lambert Weekly Report",
          body: report.pushTeaser,
          tag: "weekly-report",
          url: "/?tab=analytics",
        });
        if (result === "expired") expiredUserIds.push(sub.user_id);
        else if (result) results.weekly++;
        else results.errors++;
      }
      continue; // Don't double-notify on Sunday
    }

    // ── 2. Streak protection alert ───────────────────────────────────────────
    if (!hasLoggedToday) {
      const yesterday = new Date(Date.now() - 86400000).toLocaleDateString(
        "en-CA",
        { timeZone: tz },
      );
      const hadYesterday = (logs || []).some(
        (l) => l.created_at?.slice(0, 10) === yesterday,
      );

      if (hadYesterday) {
        // User has an active streak — danger zone
        const topDisruptor = (logs || [])
          .filter((l) => l.habit_type === "stop")
          .reduce((acc, l) => {
            acc[l.subject] = (acc[l.subject] || 0) + l.duration;
            return acc;
          }, {});
        const worstHabit = Object.entries(topDisruptor).sort(
          (a, b) => b[1] - a[1],
        )[0]?.[0];

        const result = await sendPush(sub.subscription, {
          title: "🔥 Streak at Risk — Lambert",
          body: worstHabit
            ? `Your streak ends tonight if you don't log. And "${worstHabit}" isn't going to log itself.`
            : "Your streak ends tonight. Log something — anything. Don't let momentum die.",
          tag: "streak-alert",
          url: "/",
        });
        if (result === "expired") expiredUserIds.push(sub.user_id);
        else if (result) results.streak++;
        else results.errors++;
        continue;
      }
    }

    // ── 3. Daily reminder (no log yet today) ─────────────────────────────────
    if (!hasLoggedToday) {
      const result = await sendPush(sub.subscription, {
        title: "⚡ Lambert — Log Check",
        body: "No habit logged today. The clock is running whether you track it or not.",
        tag: "daily-reminder",
        url: "/",
      });
      if (result === "expired") expiredUserIds.push(sub.user_id);
      else if (result) results.daily++;
      else results.errors++;
    }
  }

  // Clean up expired subscriptions
  if (expiredUserIds.length) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("user_id", expiredUserIds);
    results.expired = expiredUserIds.length;
  }

  return res.status(200).json({ ok: true, results });
}
