// api/ai-brief.js — Vercel Serverless Function
// Lambert AI Coach — powered by Groq (free), habit-aware, roasts when deserved.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    efficiency,
    build,
    stop,
    disruptor,
    streak,
    consistency,
    winRate,
    habits,
  } = req.body;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GROQ_API_KEY not configured" });
  }

  // ── Pre-process habits server-side so the prompt stays tight ──
  const buildHabits = {};
  const stopHabits = {};
  let lastLogDate = null;

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
      if (h.created_at) {
        const d = new Date(h.created_at);
        if (!lastLogDate || d > lastLogDate) lastLogDate = d;
      }
    });
  }

  const daysSinceLastLog = lastLogDate
    ? Math.floor((Date.now() - lastLogDate.getTime()) / 86400000)
    : null;

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

  // Compute gaps between consecutive logs (sorted newest first already)
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
      `${gapHrs}h between "${sortedLogs[i + 1].subject}" and "${sortedLogs[i].subject}"`,
    );
  }

  const topBuild = Object.entries(buildHabits)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5)
    .map(
      ([name, d]) =>
        `${name} (${d.total}min total, ${d.count} sessions, avg ${Math.round(d.total / d.count)}min/session)`,
    )
    .join("; ");

  const topStop = Object.entries(stopHabits)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5)
    .map(([name, d]) => `${name} (${d.total}min lost, ${d.count} times)`)
    .join("; ");

  const prompt = `You are Lambert — a brutally honest, sharp-tongued AI performance coach. You don't sugarcoat. You roast when the data warrants it, but your roasts always have a point. You care about results, not feelings. You speak in short, punchy sentences. No bullet points. No headers. Just 4-6 sentences of raw coaching.

Here is the user's habit data:

EFFICIENCY: ${efficiency}%
BUILD TIME: ${build} min | STOP/DISRUPTOR TIME: ${stop} min
WIN RATE (days build > stop): ${winRate}%
CURRENT STREAK: ${streak} days
CONSISTENCY RATE: ${consistency}%
TOP DISRUPTOR: "${disruptor}"
DAYS SINCE LAST LOG: ${daysSinceLastLog !== null ? daysSinceLastLog : "unknown"}
HOURS SINCE LAST LOG: ${hoursSinceLastLog !== null ? hoursSinceLastLog : "unknown"}
TIME OF LAST LOG: ${lastLogTime || "unknown"}
RECENT LOG GAPS: ${recentGaps.length ? recentGaps.join("; ") : "not enough data"}

TOP BUILD HABITS: ${topBuild || "none logged"}
TOP DISRUPTORS: ${topStop || "none logged"}

Your job:
1. Call out the biggest problem honestly — if the numbers are bad, say so directly. If they logged "${disruptor}" repeatedly, shame it.
2. Identify the ONE build habit they should double down on based on the data.
3. Give ONE specific, actionable instruction for today.
4. If streak is 0 or consistency is below 40%, roast them for it. If they're doing well, give brief credit then raise the bar.
5. End with a sharp one-liner that sticks.

Do not use filler phrases like "Great job" or "Keep it up." Be Lambert.`;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      },
    );

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    return res.status(200).json({ text });
  } catch (err) {
    console.error("Groq API error:", err);
    return res.status(500).json({
      text:
        efficiency >= 85
          ? `${efficiency}% efficiency. Decent. Don't get comfortable.`
          : `${efficiency}% efficiency. That's not a number to be proud of. Fix it.`,
    });
  }
}
