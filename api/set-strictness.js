// api/set-strictness.js — Vercel Serverless Function
// Raising the dial (more strict) always applies instantly.
// Lowering it (less strict): the very first time ever, it applies
// instantly too (mistakes happen) — every time after that, it's queued
// and only takes effect 24 hours later. Raising the dial again before
// that delay elapses cancels the pending decrease.

const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const DELAY_HOURS = 24;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { newLevel } = req.body;
  if (!Number.isInteger(newLevel) || newLevel < 1 || newLevel > 5) {
    return res.status(400).json({ error: "newLevel must be an integer 1-5" });
  }

  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing auth token" });

  const {
    data: { user },
    error: authErr,
  } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  const { data: access, error: accessErr } = await supabaseAdmin
    .from("user_access")
    .select("status, strictness_level, used_strictness_grace")
    .eq("user_id", user.id)
    .maybeSingle();

  if (accessErr || !access || access.status !== "approved") {
    return res.status(403).json({ error: "Account not approved" });
  }

  const currentLevel = access.strictness_level ?? 1;

  // ── Raising the dial (or no change): always instant ──
  if (newLevel >= currentLevel) {
    await supabaseAdmin
      .from("user_access")
      .update({
        strictness_level: newLevel,
        pending_strictness_level: null,
        strictness_change_effective_at: null,
      })
      .eq("user_id", user.id);

    await supabaseAdmin.from("strictness_changes").insert([
      {
        user_id: user.id,
        from_level: currentLevel,
        to_level: newLevel,
        effective_at: new Date().toISOString(),
        was_instant: true,
      },
    ]);

    return res.status(200).json({ applied: "instant", level: newLevel });
  }

  // ── Lowering the dial ──
  // First time ever: apply instantly, consume the one-time grace.
  if (!access.used_strictness_grace) {
    await supabaseAdmin
      .from("user_access")
      .update({
        strictness_level: newLevel,
        pending_strictness_level: null,
        strictness_change_effective_at: null,
        used_strictness_grace: true,
      })
      .eq("user_id", user.id);

    await supabaseAdmin.from("strictness_changes").insert([
      {
        user_id: user.id,
        from_level: currentLevel,
        to_level: newLevel,
        effective_at: new Date().toISOString(),
        was_instant: true,
      },
    ]);

    return res.status(200).json({ applied: "instant_grace", level: newLevel });
  }

  // Grace already used: queue it, delayed by DELAY_HOURS.
  const effectiveAt = new Date(
    Date.now() + DELAY_HOURS * 60 * 60 * 1000,
  ).toISOString();

  await supabaseAdmin
    .from("user_access")
    .update({
      pending_strictness_level: newLevel,
      strictness_change_effective_at: effectiveAt,
    })
    .eq("user_id", user.id);

  await supabaseAdmin.from("strictness_changes").insert([
    {
      user_id: user.id,
      from_level: currentLevel,
      to_level: newLevel,
      effective_at: effectiveAt,
      was_instant: false,
    },
  ]);

  return res.status(200).json({
    applied: "delayed",
    currentLevel,
    pendingLevel: newLevel,
    effectiveAt,
  });
};
