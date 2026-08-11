// api/admin-users.js — Vercel Serverless Function
// Lets an admin list all users and approve/blacklist/reset them.
// Uses the SERVICE ROLE key (bypasses RLS) — but only after verifying
// the CALLER is an admin, so a regular user can never hit this route
// and grant themselves access.
//
// Requires: SUPABASE_URL (or REACT_APP_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { action, targetUserId, newStatus } = req.body;
  const authHeader = req.headers.authorization || "";
  const callerToken = authHeader.replace("Bearer ", "");

  if (!callerToken) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  // ── Verify the caller's identity from their JWT ──
  const {
    data: { user: caller },
    error: authErr,
  } = await supabaseAdmin.auth.getUser(callerToken);

  if (authErr || !caller) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  // ── Verify the caller is an approved admin ──
  const { data: callerAccess, error: accessErr } = await supabaseAdmin
    .from("user_access")
    .select("is_admin, status")
    .eq("user_id", caller.id)
    .maybeSingle();

  if (
    accessErr ||
    !callerAccess?.is_admin ||
    callerAccess.status !== "approved"
  ) {
    return res.status(403).json({ error: "Admin access required" });
  }

  // ── action: "list" ──
  if (action === "list") {
    const { data, error } = await supabaseAdmin
      .from("user_access")
      .select("user_id, email, status, is_admin, created_at, decided_at")
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ users: data });
  }

  // ── action: "setStatus" (approve / blacklist / reset to pending) ──
  if (action === "setStatus") {
    if (
      !targetUserId ||
      !["approved", "blacklisted", "pending"].includes(newStatus)
    ) {
      return res
        .status(400)
        .json({ error: "targetUserId and valid newStatus required" });
    }
    const { error } = await supabaseAdmin
      .from("user_access")
      .update({
        status: newStatus,
        decided_at: new Date().toISOString(),
        decided_by: caller.id,
      })
      .eq("user_id", targetUserId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: "Unknown action" });
}
