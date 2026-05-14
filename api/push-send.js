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

// ── Weekly report via Groq ────────────────────────────────────────────────────

async function generateWeeklyReport(habits) {
  if (!process.env.GROQ_API_KEY || !habits.length) return null;

  const buildAgg = {},
    stopAgg = {};
  habits.forEach((h) => {
    if (h.habit_type === "continue") {
      buildAgg[h.subject] = (buildAgg[h.subject] || 0) + h.duration;
    } else {
      stopAgg[h.subject] = (stopAgg[h.subject] || 0) + h.duration;
    }
  });

  const topBuild = Object.entries(buildAgg)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([n, v]) => `${n} ${v}m`)
    .join(", ");
  const topStop = Object.entries(stopAgg)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([n, v]) => `${n} ${v}m`)
    .join(", ");
  const totalBuild = Object.values(buildAgg).reduce((s, v) => s + v, 0);
  const totalStop = Object.values(stopAgg).reduce((s, v) => s + v, 0);

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 120,
        messages: [
          {
            role: "system",
            content:
              "You are Lambert — a sharp, direct habit coach. Write a 2-sentence weekly report notification. No bullet points. Be blunt, data-driven, and end with one specific action for next week. Under 140 chars total.",
          },
          {
            role: "user",
            content: `Week summary: Built ${totalBuild}m (${topBuild || "nothing"}). Lost ${totalStop}m to disruptors (${topStop || "none"}). Write the push notification body.`,
          },
        ],
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (_) {
    return `Built ${totalBuild}m, lost ${totalStop}m. Review and recalibrate for next week.`;
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Allow manual trigger via POST (for testing) or cron GET
  if (req.method !== "GET" && req.method !== "POST")
    return res.status(405).end();

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
      const weekStart = new Date(Date.now() - 7 * 86400000).toISOString();
      const weekLogs = (logs || []).filter((l) => l.created_at >= weekStart);
      const reportBody = await generateWeeklyReport(weekLogs);

      if (reportBody) {
        const result = await sendPush(sub.subscription, {
          title: "⚡ Lambert Weekly Report",
          body: reportBody,
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
