// api/admin-usage.js — Vercel Serverless Function
// Admin-only: ranks users by chat activity (total messages sent + average
// per day since signup). Uses data already stored in lambert_conversations —
// no new tracking table needed.

const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing auth token" });

  const {
    data: { user: caller },
    error: authErr,
  } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !caller) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  const { data: callerAccess } = await supabaseAdmin
    .from("user_access")
    .select("is_admin, status")
    .eq("user_id", caller.id)
    .maybeSingle();

  if (!callerAccess?.is_admin || callerAccess.status !== "approved") {
    return res.status(403).json({ error: "Admin access required" });
  }

  // ── Pull every user's signup date + email ──
  const { data: users, error: usersErr } = await supabaseAdmin
    .from("user_access")
    .select("user_id, email, created_at")
    .eq("status", "approved");
  if (usersErr) return res.status(500).json({ error: usersErr.message });

  // ── Pull every user-sent message (not Lambert's replies) ──
  const { data: messages, error: msgErr } = await supabaseAdmin
    .from("lambert_conversations")
    .select("user_id, created_at")
    .eq("role", "user");
  if (msgErr) return res.status(500).json({ error: msgErr.message });

  const byUser = {};
  messages.forEach((m) => {
    if (!byUser[m.user_id]) byUser[m.user_id] = { count: 0, dates: new Set() };
    byUser[m.user_id].count += 1;
    byUser[m.user_id].dates.add(m.created_at.slice(0, 10));
  });

  const today = Date.now();
  const results = users.map((u) => {
    const activity = byUser[u.user_id] || { count: 0, dates: new Set() };
    const daysSinceSignup = Math.max(
      1,
      Math.ceil((today - new Date(u.created_at).getTime()) / 86400000),
    );
    return {
      email: u.email,
      totalMessages: activity.count,
      activeDays: activity.dates.size,
      avgPerDay: Math.round((activity.count / daysSinceSignup) * 10) / 10,
    };
  });

  results.sort((a, b) => b.totalMessages - a.totalMessages);

  return res.status(200).json({ users: results });
};
