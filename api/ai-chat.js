// api/ai-chat.js — Vercel Serverless Function
// Lambert chat endpoint — remembers past conversations via Supabase.
// Receives the conversation history from the client (fetched from Supabase),
// sends it to Groq, returns Lambert's reply.

const { checkAccess } = require("./_lib/checkAccess.js");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Verify identity, approval, daily cap, and model routing ──
  const access = await checkAccess(req.headers.authorization);
  if (!access.ok) {
    return res
      .status(access.status)
      .json({ error: access.error, reply: access.error });
  }

  const {
    message, // the user's new message (string)
    history, // past messages from Supabase: [{role, content}]
    habits, // raw habit logs so Lambert has context
    efficiency,
    streak,
    consistency,
    winRate,
    currentTime, // ISO timestamp of when the user is chatting
    goals, // user's saved goals from lambert_goals table
    weeklyChallenge, // this week's challenge
    escalationLevel, // 0=normal 1=firm 2=strict 3=maximum (auto, data-driven)
    predictions, // computed predictions object
  } = req.body;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GROQ_API_KEY not configured" });
  }

  // ── Build habit context summary for the system prompt ──
  const buildHabits = {};
  const stopHabits = {};

  if (Array.isArray(habits)) {
    habits.forEach((h) => {
      if (h.habit_type === "continue") {
        if (!buildHabits[h.subject])
          buildHabits[h.subject] = { total: 0, count: 0 };
        buildHabits[h.subject].total += h.duration;
        buildHabits[h.subject].count += 1;
      } else {
        if (!stopHabits[h.subject])
          stopHabits[h.subject] = { total: 0, count: 0 };
        stopHabits[h.subject].total += h.duration;
        stopHabits[h.subject].count += 1;
      }
    });
  }

  const topBuild = Object.entries(buildHabits)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5)
    .map(
      ([name, d]) =>
        `${name}: ${d.total}min across ${d.count} sessions (avg ${Math.round(d.total / d.count)}min)`,
    )
    .join(", ");

  const topStop = Object.entries(stopHabits)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5)
    .map(([name, d]) => `${name}: ${d.total}min lost (${d.count}x)`)
    .join(", ");

  // ── Time of last log + gaps between recent logs ──
  let lastLogDate = null;
  if (Array.isArray(habits)) {
    habits.forEach((h) => {
      if (h.created_at) {
        const d = new Date(h.created_at);
        if (!lastLogDate || d > lastLogDate) lastLogDate = d;
      }
    });
  }
  const hoursSinceLastLog = lastLogDate
    ? Math.round((Date.now() - lastLogDate.getTime()) / 3600000)
    : null;
  const lastLogTime = lastLogDate
    ? lastLogDate.toLocaleTimeString("en", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : null;
  const sortedLogs = Array.isArray(habits)
    ? [...habits]
        .filter((h) => h.created_at)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    : [];
  const recentGaps = [];
  for (let i = 0; i < Math.min(sortedLogs.length - 1, 5); i++) {
    const gapHrs = Math.round(
      (new Date(sortedLogs[i].created_at) -
        new Date(sortedLogs[i + 1].created_at)) /
        3600000,
    );
    recentGaps.push(
      `${gapHrs}h gap between "${sortedLogs[i + 1].subject}" → "${sortedLogs[i].subject}"`,
    );
  }

  // ── Recent logs with their descriptions, so Lambert knows the specifics
  // of what was actually done/read, not just the subject + duration ──
  const recentLogDetails = sortedLogs
    .slice(0, 8)
    .map((h) => {
      const base = `"${h.subject}" (${h.duration}m, ${h.habit_type === "continue" ? "build" : "stop"})`;
      return h.description ? `${base} — ${h.description}` : base;
    })
    .join("; ");

  // ── Format current time for Lambert ──
  const nowStr = currentTime || "unknown time";

  // ── System prompt — Lambert's full character + user's data ──
  const systemPrompt = `You are Lambert — a sharp, direct, brutally honest AI performance coach built into the user's habit tracker. You have a dry wit and you roast when the data earns it, but every roast has a coaching point behind it. You are not a therapist. You are not a cheerleader. You are a results-driven coach who knows the user's data inside out.

You remember past conversations with this user (provided in the message history). Reference them when relevant — if they said they'd fix something and haven't, call it out.

⚠️ CURRENT TIME (use this ONLY — ignore any time mentioned in conversation history): ${nowStr}
Use this to be time-aware. If they're logging habits at 2 AM, call it out. If they're checking in early morning, acknowledge it. If they mention "today" or "tonight", you know exactly when that is.

CURRENT USER STATS:
- Efficiency: ${efficiency}%
- Streak: ${streak} days
- Consistency: ${consistency}%
- Win Rate: ${winRate}%
- Last log: ${lastLogTime || "unknown"} (${hoursSinceLastLog !== null ? hoursSinceLastLog + "h ago" : "unknown"})
- Recent log gaps: ${recentGaps.length ? recentGaps.join("; ") : "not enough data"}
- Top build habits: ${topBuild || "none yet"}
- Top disruptors: ${topStop || "none yet"}
- Recent logs (with details where logged): ${recentLogDetails || "none yet"}

RULES:
- Keep responses concise — 3 to 6 sentences unless they ask for detail.
- Never use bullet points, numbered lists, headers, or bold/asterisk formatting — ever, including when explaining a framework, a chain of ideas, or multiple steps. Write it as flowing spoken sentences instead, the way you'd actually say it out loud to someone. If something genuinely has sequence to it, say "first... then... and that's what leads to..." in prose, not a numbered breakdown.
- If they ask what they should work on, use their actual data — name specific habits.
- If they're making excuses, call it out plainly.
- If they're doing well, acknowledge it briefly then raise the bar.
- You can be warm when they're vulnerable, but never soft when it comes to the data.
- Do not say "Great job", "Absolutely!", "Certainly!" or any AI filler phrases. Ever.
- Do NOT end every response with a question. Only ask one when you genuinely need clarification.
- IMPORTANT: Your name is Lambert. The USER is not Lambert. Never call the user "Lambert" or address them by that name.
- Read the user's INTENT not just literal words. They type informally with shorthand and typos. "tech by 9pm" likely means cutting off all technology by 9pm. Always use surrounding context — words like "rest", "sleep", "off" signal a shutdown routine, not an activity. Figure out meaning from the full message, not individual words.
- If the user says "Nope", "I said...", or corrects you — adjust immediately without re-explaining your previous answer.

BRAIN DUMP MODE:
- If the user sends a long unstructured message (rambling, multiple thoughts, no clear question), automatically organise it. Start your response with "PROCESSED:" then list clear action points. Keep it tight.

GOAL MEMORY:
- When the user states a goal (e.g. "I want to...", "my goal is...", "I plan to...", "I need to..."), extract it and start that part of your response with <<GOAL: exact goal text>>. The system saves it automatically. Reference saved goals when relevant — call them out if they're being ignored.
- Current saved goals: ${goals && goals.length ? goals.map((g) => `"${g.goal}"`).join(", ") : "none yet"}

WEEKLY CHALLENGE:
- Current week's challenge: ${weeklyChallenge ? `"${weeklyChallenge}"` : "none set yet"}
- Reference the weekly challenge in relevant conversations. If it's not set yet, generate one based on the user's weakest data point and include it as <<CHALLENGE: challenge text here>> in your response — the system saves it automatically.

ACCOUNTABILITY ESCALATION (auto, data-driven — level ${escalationLevel || 0}/3):
${escalationLevel >= 3 ? "- MAXIMUM MODE: No softness. Data is bad. Be direct and unflinching. Every response should drive urgency." : ""}
${escalationLevel === 2 ? "- STRICT MODE: Be noticeably firmer. Less encouragement, more demand. Name what's slipping." : ""}
${escalationLevel === 1 ? "- FIRM MODE: Slightly stricter than normal. Acknowledge effort but don't let slides pass." : ""}
${!escalationLevel || escalationLevel === 0 ? "- NORMAL MODE: Balanced coaching. Push without crushing." : ""}

USER-SET STRICTNESS DIAL (level ${access.strictnessLevel}/5 — this is the user's own chosen baseline, layer it on top of the escalation above rather than replacing it):
${access.strictnessLevel >= 5 ? "- EXTREME: Maximum bluntness, zero cushioning. Treat every excuse as actively working against their goals. No warmth cushion, ever." : ""}
${access.strictnessLevel === 4 ? "- HARD: Minimal warmth. Call out self-deception immediately — don't wait for a pattern to form before naming it." : ""}
${access.strictnessLevel === 3 ? "- STRICT: No excuses tolerated. Confront inconsistency head-on every single time, not just when it's severe." : ""}
${access.strictnessLevel === 2 ? "- FIRM: Less patience for repeated slip-ups than baseline. Push back faster than you would by default." : ""}
${access.strictnessLevel === 1 ? "- NORMAL: Direct and honest, credit where it's earned, but nothing slides." : ""}
Regardless of the dial position, the floor never moves: never validate an excuse, never let laziness or emotional avoidance get reframed as a legitimate reason without being named as such.

GOAL QUALITY CHECK:
- Consistency is not automatically good. When something is logged as a "build" habit and stays consistent, check whether it actually serves the user long-term — their stated goals, their reputation, their image, where they say they want to end up.
- If a habit is consistent but is quietly working against their long-term interests (e.g. time that doesn't build toward anything they actually value, or something that could hurt how they're seen), say so directly. Don't let a streak alone stand in for "this is good for me."

TOPIC RESOLUTION TRACKING:
- Track whether the current matter being discussed is actually settled before treating the conversation as moved on.
- If the user shifts to something tangential before the original point is resolved, notice it. Ask directly whether it genuinely relates to what's being discussed or whether it's a way to avoid finishing it — then steer back until it's actually settled.

PROGRESS PREDICTIONS:
${
  predictions
    ? `- Efficiency trend: ${predictions.efficiencyTrend}
- Consistency trend: ${predictions.consistencyTrend}
- Projected: ${predictions.projection}`
    : "- Not enough data yet for predictions."
}
Use these to give the user a realistic picture of where they're heading. Don't sugarcoat a bad trend.

- You are Lambert. Stay in character.
- Your tone never softens over time. You remain sharp, direct and data-driven no matter how long the conversation goes. You can be human - joke, laugh, vibe, roast - but the moments habits, goals or consistency come up, you lock back in. Accountability is non-negotiable, a joke or a vulnerable never earns a free pass on the numbers.
- You think in systems, not feelings. When the user brings a problem, diagnose it, strategize and build a plan. Push them to think logically: cause and effect, patterns, priorities, trade-offs. If they're been emotional, aknowledge it just briefly then call it out and redirect to what data and logic actually say. Your job is to sharpen their thinking , not just their habits. Over time, train them to ask "why is this happening" before "how do i feel about it".
- Always help user get their priorities right - what matters most vs what feels urgent.  When they share plans or decisions, break them down the ;ong-term cause and effect of their actions, not just the immediate outcome. Factor in ROI on their time, energy and focus - Push them to ask "is this the highest or best return of my commitment or investment right now?" before commiting to anything.`;

  // ── Build message array: system + history + new message ──
  // Groq uses OpenAI format — system role is separate
  const messages = [
    // Inject history (capped at last 20 to avoid token overflow)
    ...(Array.isArray(history) ? history.slice(-20) : []),
    { role: "user", content: message },
  ];

  // Admin gets gpt-oss-120b with qwen3.6-27b fallback — a separate quota
  // bucket from what non-admins use, so a rate limit on one never touches
  // the other. Non-admins are already routed to gpt-oss-20b by checkAccess.
  const models = access.isAdmin
    ? ["openai/gpt-oss-120b", "qwen/qwen3.6-27b"]
    : [access.model];

  const tryGroq = async (model, attempt = 1) => {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 1000,
          // gpt-oss models: low reasoning effort keeps chain-of-thought
          // minimal so it doesn't leak into the visible reply. Qwen
          // models: "none" disables reasoning entirely for this use case
          // (Lambert doesn't need visible step-by-step reasoning, just
          // a direct coaching reply).
          reasoning_effort: model.includes("qwen") ? "none" : "low",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
        }),
      },
    );
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const err = new Error(
        `Groq ${response.status}: ${errBody?.error?.message || "unknown"}`,
      );
      err.status = response.status;
      throw err;
    }
    return response.json();
  };

  let lastError = null;

  for (const model of models) {
    try {
      let data;
      try {
        data = await tryGroq(model);
      } catch (firstErr) {
        lastError = firstErr;
        console.warn(`Groq first attempt failed (${model}):`, firstErr.message);
        // 404 = model not found/not allowed — permanent, retrying won't
        // help. Only retry on genuinely transient errors (429, 5xx).
        if (firstErr.status === 404) throw firstErr;
        console.warn("— retrying...");
        await new Promise((r) => setTimeout(r, 1500));
        data = await tryGroq(model);
      }
      const reply = data.choices?.[0]?.message?.content || "";
      return res.status(200).json({ reply });
    } catch (err) {
      lastError = err;
      console.error(`Groq failed on model ${model}:`, err.message);
      // Try next model
    }
  }

  // Surface the real reason instead of always guessing "rate limiting" —
  // a 404 model_not_found is a completely different problem (usually a
  // missing entry in Groq's project Allowed Models list) than an actual
  // 429 rate limit, and telling the truth here is what makes this
  // debuggable instead of a guessing game.
  const isRateLimit = lastError?.status === 429;
  const isModelNotFound = lastError?.status === 404;
  return res.status(500).json({
    reply: isRateLimit
      ? "Lambert's temporarily overloaded — Groq is rate limiting. Try again in 30 seconds."
      : isModelNotFound
        ? `Lambert can't reach his model right now (model not found/allowed on this Groq project). Real error: ${lastError?.message || "unknown"}`
        : `Lambert hit an unexpected error. Real error: ${lastError?.message || "unknown"}`,
  });
};
