// api/report-pdf.js — Vercel Serverless Function
// Generates a downloadable PDF of a stored weekly report.
// GET /api/report-pdf?week=2026-08-09 (or omit `week` for the latest one)
// Requires Authorization: Bearer <session token>

import { createClient } from "@supabase/supabase-js";
import PDFDocument from "pdfkit";

const supabaseAdmin = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  // ── Verify identity + approval only — this is a document export,
  // not a chat message, so it doesn't touch the daily message cap. ──
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing auth token" });

  const {
    data: { user },
    error: authErr,
  } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  const { data: access } = await supabaseAdmin
    .from("user_access")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!access || access.status !== "approved") {
    return res.status(403).json({ error: "Account not approved" });
  }

  // ── Fetch the requested (or latest) report for this user ──
  let query = supabaseAdmin
    .from("weekly_reports")
    .select("*")
    .eq("user_id", user.id)
    .order("week_start", { ascending: false })
    .limit(1);

  if (req.query.week) {
    query = supabaseAdmin
      .from("weekly_reports")
      .select("*")
      .eq("user_id", user.id)
      .eq("week_start", req.query.week);
  }

  const { data: reports, error: reportErr } = await query;
  if (reportErr) return res.status(500).json({ error: reportErr.message });
  if (!reports || !reports.length) {
    return res.status(404).json({ error: "No report found" });
  }
  const report = reports[0];

  // ── Build the PDF ──
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="lambert-report-${report.week_start}.pdf"`,
  );

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc
    .fontSize(20)
    .fillColor("#1d4ed8")
    .text("LAMBERT — Weekly Report", { align: "left" });
  doc
    .fontSize(10)
    .fillColor("#666")
    .text(`Week of ${report.week_start}`, { align: "left" });
  doc.moveDown(1.5);

  // Stats row
  doc.fontSize(12).fillColor("#000");
  doc.text(
    `Build: ${report.build_total}m   Stop: ${report.stop_total}m   Efficiency: ${report.efficiency}%`,
  );
  doc.text(
    `Consistency: ${report.consistency}%   Win Rate: ${report.win_rate}%`,
  );
  if (
    report.week_over_week_pct !== null &&
    report.week_over_week_pct !== undefined
  ) {
    doc.text(
      `${report.week_over_week_pct >= 0 ? "Up" : "Down"} ${Math.abs(report.week_over_week_pct)}% vs last week`,
    );
  }
  doc.moveDown(1);

  // Lambert's summary
  doc.fontSize(13).fillColor("#1d4ed8").text("Lambert's Take");
  doc
    .fontSize(11)
    .fillColor("#000")
    .text(report.lambert_summary || "No summary available.");
  doc.moveDown(1);

  // Top build habits
  doc.fontSize(13).fillColor("#059669").text("Top Build Habits");
  const topBuild = report.top_build || [];
  if (!topBuild.length) {
    doc.fontSize(11).fillColor("#000").text("None logged this week.");
  } else {
    topBuild.forEach((h) => {
      doc.fontSize(11).fillColor("#000").text(`• ${h.subject} — ${h.minutes}m`);
    });
  }
  doc.moveDown(1);

  // Top disruptors + break strategies
  doc
    .fontSize(13)
    .fillColor("#dc2626")
    .text("Top Disruptors — and how to break them");
  const topDisruptors = report.top_disruptors || [];
  if (!topDisruptors.length) {
    doc.fontSize(11).fillColor("#000").text("None logged this week.");
  } else {
    topDisruptors.forEach((h) => {
      doc
        .fontSize(11)
        .fillColor("#000")
        .text(`• ${h.subject} — ${h.minutes}m`, { continued: false });
      if (h.breakStrategy) {
        doc.fontSize(10).fillColor("#444").text(`   → ${h.breakStrategy}`);
      }
      doc.moveDown(0.3);
    });
  }

  doc.end();
}
