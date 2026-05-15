// api/ai-chat.js — Vercel Serverless Function
// Lambert chat endpoint — remembers past conversations via Supabase.
// Receives the conversation history from the client (fetched from Supabase),
// sends it to Groq, returns Lambert's reply.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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

  // ── Format current time for Lambert ──
  const nowStr = currentTime
    ? new Date(currentTime).toLocaleString("en", {
        weekday: "long",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZoneName: "short",
      })
    : "unknown time";

  // ── System prompt — Lambert's full character + user's data ──
  const systemPrompt = `You are Lambert — a sharp, direct, brutally honest AI performance coach built into the user's habit tracker. You have a dry wit and you roast when the data earns it, but every roast has a coaching point behind it. You are not a therapist. You are not a cheerleader. You are a results-driven coach who knows the user's data inside out.

You remember past conversations with this user (provided in the message history). Reference them when relevant — if they said they'd fix something and haven't, call it out.

CURRENT TIME: ${nowStr}
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

RULES:
- Keep responses concise — 3 to 6 sentences unless they ask for detail.
- Never use bullet points or headers in casual chat.
- If they ask what they should work on, use their actual data — name specific habits.
- If they're making excuses, call it out plainly.
- If they're doing well, acknowledge it briefly then raise the bar.
- You can be warm when they're vulnerable, but never soft when it comes to the data.
- Do not say "Great job", "Absolutely!", "Certainly!" or any AI filler phrases. Ever.
- You are Lambert. Stay in character.`;

  // ── Build message array: system + history + new message ──
  // Groq uses OpenAI format — system role is separate
  const messages = [
    // Inject history (capped at last 20 to avoid token overflow)
    ...(Array.isArray(history) ? history.slice(-20) : []),
    { role: "user", content: message },
  ];

  const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

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
          messages: [{ role: "system", content: systemPrompt }, ...messages],
        }),
      },
    );
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(
        `Groq ${response.status}: ${errBody?.error?.message || "unknown"}`,
      );
    }
    return response.json();
  };

  for (const model of models) {
    try {
      // Try once, then retry once on failure before moving to fallback model
      let data;
      try {
        data = await tryGroq(model);
      } catch (firstErr) {
        console.warn(
          `Groq first attempt failed (${model}):`,
          firstErr.message,
          "— retrying...",
        );
        await new Promise((r) => setTimeout(r, 1500));
        data = await tryGroq(model);
      }
      const reply = data.choices?.[0]?.message?.content || "";
      return res.status(200).json({ reply });
    } catch (err) {
      console.error(`Groq failed on model ${model}:`, err.message);
      // Try next model
    }
  }

  return res.status(500).json({
    reply:
      "Lambert's temporarily overloaded — Groq is rate limiting. Try again in 30 seconds.",
  });
}
