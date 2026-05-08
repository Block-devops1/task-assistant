import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Zap,
  BarChart2,
  Home,
  LogOut,
  Target,
  Trash2,
  BookOpen,
  Menu,
  X,
  Activity,
  Lock,
  Mail,
  Clock,
  Shield,
  TrendingUp,
  Flame,
  RefreshCw,
  Plus,
  ChevronRight,
  Award,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  ComposedChart,
  Bar,
  Line,
  ReferenceLine,
} from "recharts";

// --- SUPABASE SETUP ---
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error(
    "MISSION CRITICAL: Supabase Keys missing from Environment Variables.",
  );
}
const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder-key",
);

// --- EFFICIENCY RING (Custom SVG) ---
const EfficiencyRing = ({ percent }) => {
  const size = 210;
  const r = 82;
  const strokeWidth = 15;
  const circumference = 2 * Math.PI * r;
  const safePercent = Math.min(100, Math.max(0, percent));
  const offset = circumference - (safePercent / 100) * circumference;
  const color =
    safePercent >= 85 ? "#10b981" : safePercent >= 50 ? "#3b82f6" : "#ef4444";

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        margin: "0 auto",
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
        />
        {/* Glow layer */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth + 6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          opacity={0.12}
          style={{
            transition:
              "stroke-dashoffset 1.4s cubic-bezier(0.34,1.56,0.64,1), stroke 0.5s ease",
          }}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition:
              "stroke-dashoffset 1.4s cubic-bezier(0.34,1.56,0.64,1), stroke 0.5s ease",
          }}
        />
      </svg>
      {/* Center label */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "2.8rem",
            fontWeight: "700",
            color,
            lineHeight: 1,
            transition: "color 0.5s ease",
          }}
        >
          {safePercent}%
        </div>
        <div
          style={{
            fontSize: "0.55rem",
            opacity: 0.35,
            letterSpacing: "2.5px",
            marginTop: "6px",
          }}
        >
          EFFICIENCY
        </div>
      </div>
    </div>
  );
};

// --- STAT CARD ---
const StatCard = ({
  icon: Icon,
  label,
  value,
  color = "#3b82f6",
  unit = "",
}) => (
  <div
    style={{
      background: "#0f172a",
      borderRadius: "16px",
      padding: "14px 16px",
      border: "1px solid rgba(255,255,255,0.05)",
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "7px",
        opacity: 0.45,
      }}
    >
      <Icon size={12} color={color} />
      <span
        style={{
          fontSize: "0.58rem",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
    <div
      style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: "1.4rem",
        fontWeight: "700",
        color,
      }}
    >
      {value}
      <span style={{ fontSize: "0.75rem", opacity: 0.5, marginLeft: "2px" }}>
        {unit}
      </span>
    </div>
  </div>
);

// --- MAIN APP ---
const App = () => {
  // State
  const [session, setSession] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeMenuSection, setActiveMenuSection] = useState("home");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState("");
  const [habitType, setHabitType] = useState("continue");
  const [shieldActive, setShieldActive] = useState(false);
  const [globalGoal, setGlobalGoal] = useState(180);
  const [aiBriefingText, setAiBriefingText] = useState("");
  const [aiBriefingLoading, setAiBriefingLoading] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // --- FONT & GLOBAL CSS INJECTION ---
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; }
      body { margin: 0; background: #020617; font-family: 'Syne', sans-serif; }

      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(22px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes slideInLeft {
        from { transform: translateX(-100%); opacity: 0; }
        to   { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideUpModal {
        from { opacity: 0; transform: translateY(50px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes flameDance {
        0%, 100% { transform: scaleY(1) rotate(-3deg); }
        50%       { transform: scaleY(1.12) rotate(3deg); }
      }
      @keyframes shimmer {
        0%   { background-position: -200% center; }
        100% { background-position:  200% center; }
      }
      @keyframes shieldPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
        50%       { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
      }

      .fade-up   { animation: fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both; }
      .fade-up-1 { animation: fadeUp 0.55s 0.06s cubic-bezier(0.16,1,0.3,1) both; }
      .fade-up-2 { animation: fadeUp 0.55s 0.12s cubic-bezier(0.16,1,0.3,1) both; }
      .fade-up-3 { animation: fadeUp 0.55s 0.18s cubic-bezier(0.16,1,0.3,1) both; }
      .fade-up-4 { animation: fadeUp 0.55s 0.24s cubic-bezier(0.16,1,0.3,1) both; }
      .fade-up-5 { animation: fadeUp 0.55s 0.30s cubic-bezier(0.16,1,0.3,1) both; }

      .menu-slide  { animation: slideInLeft 0.32s cubic-bezier(0.16,1,0.3,1) forwards; }
      .modal-slide { animation: slideUpModal 0.38s cubic-bezier(0.16,1,0.3,1) forwards; }

      .shimmer-text {
        background: linear-gradient(90deg, #94a3b8 0%, #e2e8f0 50%, #94a3b8 100%);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: shimmer 2s linear infinite;
      }

      input:focus, select:focus {
        outline: none !important;
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important;
      }
      button { transition: transform 0.12s, opacity 0.12s; }
      button:active { transform: scale(0.97) !important; }

      .nav-item { transition: background 0.15s, color 0.15s; }
      .nav-item:hover { background: rgba(255,255,255,0.05) !important; }

      .log-item { transition: border-color 0.2s, background 0.2s; }
      .log-item:hover { border-color: rgba(255,255,255,0.1) !important; background: #111827 !important; }

      .trash-btn { transition: opacity 0.2s, color 0.2s; }
      .trash-btn:hover { opacity: 1 !important; color: #ef4444; }

      .shield-pulse { animation: shieldPulse 2s ease-in-out infinite; }

      ::-webkit-scrollbar { width: 3px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  // --- AUTH ---
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) fetchLogs();
  }, [session]); // eslint-disable-line

  // --- DATA ---
  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("habit_logs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("Sync Error:", error.message);
    if (data) setTasks(data);
  };

  const deleteLog = async (id) => {
    await supabase.from("habit_logs").delete().eq("id", id);
    fetchLogs();
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const { error } = isSignUp
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (isSignUp) alert("Confirmation email sent! Check your inbox.");
    } catch (err) {
      alert("Auth Failure: " + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // --- ANALYTICS ENGINE ---
  const briefingData = useMemo(() => {
    const build = tasks
      .filter((t) => t.habit_type === "continue")
      .reduce((s, t) => s + t.duration, 0);
    const stop = tasks
      .filter((t) => t.habit_type === "stop")
      .reduce((s, t) => s + t.duration, 0);
    const total = build + stop;
    const efficiency =
      total === 0 ? 0 : Math.max(0, Math.round(((build - stop) / total) * 100));
    const disruptor =
      tasks
        .filter((t) => t.habit_type === "stop")
        .sort((a, b) => b.duration - a.duration)[0]?.subject || "none";
    const isThreat =
      shieldActive &&
      habitType === "stop" &&
      subject.toLowerCase().includes(disruptor.toLowerCase()) &&
      subject !== "";
    return { efficiency, build, stop, total, disruptor, isThreat };
  }, [tasks, subject, habitType, shieldActive]);

  const streak = useMemo(() => {
    if (tasks.length === 0) return 0;
    const dates = [...new Set(tasks.map((t) => t.created_at?.split("T")[0]))]
      .sort()
      .reverse();
    let count = 0;
    const today = new Date().toISOString().split("T")[0];
    let check = today;
    for (const date of dates) {
      if (date === check) {
        count++;
        const d = new Date(check);
        d.setDate(d.getDate() - 1);
        check = d.toISOString().split("T")[0];
      } else if (date < check) break;
    }
    return count;
  }, [tasks]);

  const pieSegments = useMemo(() => {
    const buildTasks = tasks.filter((t) => t.habit_type === "continue");
    if (buildTasks.length === 0)
      return [{ name: "No data", value: 1, color: "#1e293b" }];
    const agg = buildTasks.reduce((acc, t) => {
      acc[t.subject] = (acc[t.subject] || 0) + t.duration;
      return acc;
    }, {});
    return Object.entries(agg).map(([name, value], i) => ({
      name,
      value,
      color: ["#3b82f6", "#10b981", "#8b5cf6", "#fbbf24", "#f43f5e"][i % 5],
    }));
  }, [tasks]);

  const chartData = useMemo(
    () =>
      [...tasks].reverse().map((t, i) => ({
        name: t.created_at
          ? new Date(t.created_at).toLocaleDateString("en", {
              month: "short",
              day: "numeric",
            })
          : `#${i + 1}`,
        duration: t.duration,
        type: t.habit_type,
        subject: t.subject,
      })),
    [tasks],
  );

  // --- AI BRIEFING (Anthropic API) ---
  const fetchAIBriefing = useCallback(async () => {
    setAiBriefingLoading(true);
    const { efficiency, build, stop, disruptor } = briefingData;
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `You are Lambert, a sharp AI executive coach specializing in habit optimization. Generate a crisp, tactical 2-sentence briefing (35 words max) for a user with these stats: Efficiency: ${efficiency}%, Build time: ${build}min, Disruptor time: ${stop}min, Top disruptor: "${disruptor}", Current streak: ${streak} days. Be direct and data-driven. No filler. No pleasantries. Speak with authority.`,
            },
          ],
        }),
      });
      const data = await response.json();
      setAiBriefingText(
        data.content?.[0]?.text || "Efficiency nominal. Maintain momentum.",
      );
    } catch {
      setAiBriefingText(
        briefingData.efficiency >= 85
          ? `Efficiency at ${briefingData.efficiency}%. Core stable—maintain the vector.`
          : `${briefingData.efficiency}% efficiency. Variance detected. Recalibrate disruptors now.`,
      );
    } finally {
      setAiBriefingLoading(false);
    }
  }, [briefingData, streak]);

  useEffect(() => {
    if (session && tasks.length > 0) fetchAIBriefing();
  }, [tasks.length, session]); // eslint-disable-line

  // --- LOG HABIT ---
  const handleLogHabit = async () => {
    if (!subject || !duration) return;
    if (
      briefingData.isThreat &&
      !window.confirm(
        `⚠ Lambert Shield: "${briefingData.disruptor}" is your #1 disruptor. Log anyway?`,
      )
    )
      return;
    setIsLogging(true);
    const { error } = await supabase.from("habit_logs").insert([
      {
        subject: subject.replace(/[<>]/g, "").trim(),
        duration: parseInt(duration),
        habit_type: habitType,
        user_id: session.user.id,
      },
    ]);
    if (error) {
      alert(error.message);
    } else {
      fetchLogs();
      setIsModalOpen(false);
      setSubject("");
      setDuration("");
      setHabitType("continue");
    }
    setIsLogging(false);
  };

  // --- SHARED STYLES ---
  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    background: "#1e293b",
    color: "white",
    border: "1px solid rgba(255,255,255,0.08)",
    marginBottom: "12px",
    fontSize: "0.95rem",
    fontFamily: "'Syne', sans-serif",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const cardStyle = {
    background: "#0f172a",
    borderRadius: "20px",
    padding: "24px",
    border: "1px solid rgba(255,255,255,0.05)",
  };

  // ===================== AUTH SCREEN =====================
  if (!session) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#020617",
          color: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          position: "relative",
          overflow: "hidden",
          fontFamily: "'Syne', sans-serif",
        }}
      >
        {/* Grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.025,
            backgroundImage:
              "linear-gradient(rgba(59,130,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,1) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        {/* Glow orb */}
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "700px",
            height: "700px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(59,130,246,0.09) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Logo */}
        <div
          className="fade-up"
          style={{ textAlign: "center", marginBottom: "48px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "14px",
              marginBottom: "10px",
            }}
          >
            <Zap size={36} color="#fbbf24" />
            <h1
              style={{
                margin: 0,
                fontSize: "2.4rem",
                fontWeight: "800",
                letterSpacing: "5px",
              }}
            >
              LAMBERT
            </h1>
          </div>
          <p
            style={{
              margin: 0,
              opacity: 0.35,
              fontSize: "0.7rem",
              letterSpacing: "4px",
            }}
          >
            EXECUTIVE HABIT ENGINE
          </p>
        </div>

        {/* Auth Form */}
        <form
          onSubmit={handleAuth}
          className="fade-up"
          style={{ width: "100%", maxWidth: "360px" }}
        >
          <div style={{ position: "relative" }}>
            <Mail
              size={14}
              style={{
                position: "absolute",
                left: "16px",
                top: "16px",
                opacity: 0.3,
                color: "white",
              }}
            />
            <input
              placeholder="Email address"
              type="email"
              style={{ ...inputStyle, paddingLeft: "44px" }}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={{ position: "relative" }}>
            <Lock
              size={14}
              style={{
                position: "absolute",
                left: "16px",
                top: "16px",
                opacity: 0.3,
                color: "white",
              }}
            />
            <input
              placeholder="Password"
              type="password"
              style={{ ...inputStyle, paddingLeft: "44px" }}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={authLoading}
            style={{
              background: authLoading
                ? "#1e3a8a"
                : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
              color: "white",
              padding: "16px",
              borderRadius: "14px",
              border: "none",
              width: "100%",
              fontWeight: "700",
              cursor: authLoading ? "not-allowed" : "pointer",
              fontSize: "0.9rem",
              letterSpacing: "1.5px",
              fontFamily: "'Syne', sans-serif",
              boxShadow: authLoading
                ? "none"
                : "0 4px 28px rgba(59,130,246,0.3)",
            }}
          >
            {authLoading
              ? "AUTHENTICATING..."
              : isSignUp
                ? "CREATE ACCOUNT"
                : "ACCESS HUB"}
          </button>

          <p
            onClick={() => setIsSignUp(!isSignUp)}
            style={{
              textAlign: "center",
              marginTop: "24px",
              fontSize: "0.8rem",
              opacity: 0.4,
              cursor: "pointer",
            }}
          >
            {isSignUp
              ? "Already have access? Sign In"
              : "New executive? Create an account"}
          </p>
        </form>
      </div>
    );
  }

  // ===================== MAIN HUB =====================
  return (
    <div
      style={{
        background: "#020617",
        color: "white",
        minHeight: "100vh",
        fontFamily: "'Syne', sans-serif",
      }}
    >
      {/* ===== DRAWER MENU ===== */}
      {isMenuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(2,6,23,0.6)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="menu-slide"
            style={{
              width: "290px",
              background: "#070f1f",
              height: "100%",
              borderRight: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu header */}
            <div
              style={{
                padding: "32px 24px 22px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <Zap size={16} color="#fbbf24" />
                  <span
                    style={{
                      fontWeight: "800",
                      letterSpacing: "2.5px",
                      fontSize: "1rem",
                    }}
                  >
                    LAMBERT
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.63rem",
                    opacity: 0.35,
                    letterSpacing: "0.5px",
                  }}
                >
                  {session.user.email}
                </p>
              </div>
              <X
                size={18}
                onClick={() => setIsMenuOpen(false)}
                style={{ cursor: "pointer", opacity: 0.5 }}
              />
            </div>

            {/* Nav links */}
            <div style={{ padding: "18px 14px", flex: 1 }}>
              {[
                { id: "home", icon: Home, label: "Dashboard" },
                { id: "analytics", icon: BarChart2, label: "Analytics Hub" },
                { id: "targets", icon: Target, label: "Target Settings" },
              ].map((item) => (
                <div
                  key={item.id}
                  className="nav-item"
                  onClick={() => {
                    setActiveMenuSection(item.id);
                    setIsMenuOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "13px 14px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    marginBottom: "4px",
                    background:
                      activeMenuSection === item.id
                        ? "rgba(59,130,246,0.1)"
                        : "transparent",
                    border:
                      activeMenuSection === item.id
                        ? "1px solid rgba(59,130,246,0.22)"
                        : "1px solid transparent",
                    color:
                      activeMenuSection === item.id
                        ? "#3b82f6"
                        : "rgba(255,255,255,0.7)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <item.icon size={17} />
                    <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight size={13} opacity={0.3} />
                </div>
              ))}
            </div>

            {/* Shield Toggle */}
            <div
              style={{
                padding: "18px 24px",
                borderTop: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    opacity: 0.65,
                  }}
                >
                  <Shield
                    size={14}
                    color={shieldActive ? "#ef4444" : "#64748b"}
                  />
                  <span style={{ fontSize: "0.82rem" }}>Lambert Shield</span>
                </div>
                {/* Toggle switch */}
                <div
                  onClick={() => setShieldActive(!shieldActive)}
                  style={{
                    width: "46px",
                    height: "26px",
                    borderRadius: "13px",
                    background: shieldActive ? "#ef4444" : "#334155",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.3s",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "3px",
                      left: shieldActive ? "22px" : "3px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: "white",
                      transition: "left 0.28s cubic-bezier(0.34,1.56,0.64,1)",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Sign Out */}
            <div style={{ padding: "0 24px 30px" }}>
              <div
                onClick={() => supabase.auth.signOut()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  opacity: 0.35,
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  padding: "12px 0",
                }}
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== PAGE CONTENT ===== */}
      <div
        style={{ maxWidth: "820px", margin: "0 auto", padding: "0 18px 100px" }}
      >
        {/* HEADER */}
        <header
          style={{
            padding: "22px 0 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            onClick={() => setIsMenuOpen(true)}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "13px",
              background: "#0f172a",
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Menu size={17} />
          </div>

          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "0.55rem",
                opacity: 0.35,
                letterSpacing: "3px",
                marginBottom: "2px",
              }}
            >
              LAMBERT ENGINE
            </div>
            <div
              style={{
                fontWeight: "800",
                fontSize: "0.95rem",
                letterSpacing: "0.5px",
              }}
            >
              {activeMenuSection === "home"
                ? "Executive HUB"
                : activeMenuSection === "analytics"
                  ? "Analytics HUB"
                  : "Target Settings"}
            </div>
          </div>

          <div
            onClick={() => supabase.auth.signOut()}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "13px",
              background: "#0f172a",
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <LogOut size={15} style={{ opacity: 0.55 }} />
          </div>
        </header>

        {/* ===== DASHBOARD ===== */}
        {activeMenuSection === "home" && (
          <div>
            {/* AI BRIEFING CARD */}
            <div
              className={`fade-up-1 ${briefingData.isThreat ? "shield-pulse" : ""}`}
              style={{
                background: briefingData.isThreat
                  ? "rgba(239,68,68,0.07)"
                  : "rgba(59,130,246,0.05)",
                border: briefingData.isThreat
                  ? "1px solid rgba(239,68,68,0.28)"
                  : "1px solid rgba(59,130,246,0.18)",
                borderRadius: "20px",
                padding: "20px 22px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Zap size={11} color="#fbbf24" />
                  <span
                    style={{
                      fontSize: "0.58rem",
                      color: "#fbbf24",
                      letterSpacing: "2.5px",
                      fontWeight: "700",
                    }}
                  >
                    AI BRIEFING
                  </span>
                  {briefingData.isThreat && (
                    <span
                      style={{
                        fontSize: "0.55rem",
                        color: "#ef4444",
                        letterSpacing: "1px",
                        fontWeight: "700",
                        background: "rgba(239,68,68,0.15)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      ⚠ SHIELD ALERT
                    </span>
                  )}
                </div>
                <button
                  onClick={fetchAIBriefing}
                  disabled={aiBriefingLoading}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: aiBriefingLoading ? "not-allowed" : "pointer",
                    opacity: 0.4,
                    padding: "4px",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <RefreshCw
                    size={12}
                    style={{
                      animation: aiBriefingLoading
                        ? "spin 1s linear infinite"
                        : "none",
                    }}
                  />
                </button>
              </div>
              <p
                style={{
                  margin: 0,
                  fontWeight: "600",
                  fontSize: "0.95rem",
                  lineHeight: 1.55,
                  opacity: aiBriefingLoading ? 0.5 : 1,
                  transition: "opacity 0.3s",
                }}
              >
                {aiBriefingLoading ? (
                  <span className="shimmer-text">
                    Calibrating executive briefing...
                  </span>
                ) : aiBriefingText ? (
                  `"${aiBriefingText}"`
                ) : (
                  `"${
                    briefingData.efficiency >= 85
                      ? `Efficiency at ${briefingData.efficiency}%. Core stable—maintain the vector.`
                      : `${briefingData.efficiency}% efficiency. Variance detected. Recalibrate disruptors.`
                  }"`
                )}
              </p>
            </div>

            {/* EFFICIENCY RING CARD */}
            <div
              className="fade-up-2"
              style={{
                ...cardStyle,
                textAlign: "center",
                marginBottom: "14px",
              }}
            >
              <EfficiencyRing percent={briefingData.efficiency} />
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <StatCard
                  icon={TrendingUp}
                  label="Build"
                  value={briefingData.build}
                  unit="m"
                  color="#10b981"
                />
                <StatCard
                  icon={Activity}
                  label="Stop"
                  value={briefingData.stop}
                  unit="m"
                  color="#ef4444"
                />
                <StatCard
                  icon={Clock}
                  label="Total"
                  value={briefingData.total}
                  unit="m"
                  color="#3b82f6"
                />
              </div>
            </div>

            {/* STREAK + DEEP WORK ROW */}
            <div
              className="fade-up-3"
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  ...cardStyle,
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "18px 20px",
                }}
              >
                <span
                  style={{
                    fontSize: "2rem",
                    animation:
                      streak > 0
                        ? "flameDance 2.2s ease-in-out infinite"
                        : "none",
                    display: "inline-block",
                  }}
                >
                  🔥
                </span>
                <div>
                  <div
                    style={{
                      fontSize: "0.57rem",
                      opacity: 0.4,
                      letterSpacing: "2px",
                    }}
                  >
                    STREAK
                  </div>
                  <div
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: "1.55rem",
                      fontWeight: "700",
                      color: "#fbbf24",
                    }}
                  >
                    {streak}
                    <span
                      style={{
                        fontSize: "0.7rem",
                        opacity: 0.5,
                        marginLeft: "4px",
                      }}
                    >
                      days
                    </span>
                  </div>
                </div>
              </div>
              <div
                style={{
                  ...cardStyle,
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "18px 20px",
                }}
              >
                <BookOpen size={22} color="#8b5cf6" style={{ flexShrink: 0 }} />
                <div>
                  <div
                    style={{
                      fontSize: "0.57rem",
                      opacity: 0.4,
                      letterSpacing: "2px",
                    }}
                  >
                    DEEP WORK
                  </div>
                  <div
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: "1.55rem",
                      fontWeight: "700",
                      color: "#8b5cf6",
                    }}
                  >
                    {briefingData.build}
                    <span
                      style={{
                        fontSize: "0.7rem",
                        opacity: 0.5,
                        marginLeft: "4px",
                      }}
                    >
                      min
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SUBJECT PIE */}
            {tasks.filter((t) => t.habit_type === "continue").length > 0 && (
              <div
                className="fade-up-4"
                style={{ ...cardStyle, marginBottom: "14px" }}
              >
                <p
                  style={{
                    margin: "0 0 14px",
                    fontSize: "0.62rem",
                    opacity: 0.4,
                    letterSpacing: "2px",
                  }}
                >
                  SUBJECT BREAKDOWN
                </p>
                <ResponsiveContainer width="100%" height={155}>
                  <PieChart>
                    <Pie
                      data={pieSegments}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={65}
                      stroke="none"
                      paddingAngle={5}
                    >
                      {pieSegments.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "10px",
                        fontFamily: "Syne",
                        fontSize: "0.8rem",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginTop: "6px",
                    justifyContent: "center",
                  }}
                >
                  {pieSegments.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.72rem",
                        opacity: 0.65,
                      }}
                    >
                      <div
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: s.color,
                        }}
                      />
                      {s.name}
                      <span style={{ opacity: 0.5 }}>({s.value}m)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LOG BUTTON */}
            <button
              className="fade-up-5"
              onClick={() => setIsModalOpen(true)}
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                color: "white",
                padding: "17px",
                borderRadius: "16px",
                border: "none",
                width: "100%",
                fontWeight: "700",
                cursor: "pointer",
                fontSize: "0.95rem",
                fontFamily: "'Syne', sans-serif",
                letterSpacing: "0.5px",
                boxShadow: "0 4px 28px rgba(59,130,246,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "28px",
              }}
            >
              <Plus size={17} /> Log New Habit
            </button>

            {/* SYSTEM LOGS */}
            <p
              style={{
                fontSize: "0.62rem",
                opacity: 0.35,
                marginBottom: "12px",
                letterSpacing: "2px",
              }}
            >
              SYSTEM LOGS ({tasks.length})
            </p>
            {tasks.length === 0 && (
              <div
                style={{
                  ...cardStyle,
                  textAlign: "center",
                  padding: "44px",
                  opacity: 0.35,
                }}
              >
                <Activity
                  size={26}
                  style={{ marginBottom: "10px", opacity: 0.5 }}
                />
                <p style={{ margin: 0, fontSize: "0.9rem" }}>
                  No habits logged yet. Start tracking.
                </p>
              </div>
            )}
            {tasks.slice(0, 10).map((t, idx) => (
              <div
                key={t.id}
                className="log-item"
                style={{
                  background: "#0f172a",
                  padding: "13px 15px",
                  borderRadius: "14px",
                  marginBottom: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid rgba(255,255,255,0.04)",
                  animation: `fadeUp 0.4s ${idx * 0.04}s both`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "11px",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "10px",
                      background:
                        t.habit_type === "continue"
                          ? "rgba(16,185,129,0.1)"
                          : "rgba(239,68,68,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Activity
                      size={13}
                      color={
                        t.habit_type === "continue" ? "#10b981" : "#ef4444"
                      }
                    />
                  </div>
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "0.88rem" }}>
                      {t.subject}
                    </div>
                    <div
                      style={{
                        fontSize: "0.62rem",
                        opacity: 0.35,
                        marginTop: "2px",
                      }}
                    >
                      {t.habit_type === "continue" ? "BUILD" : "STOP"}
                      {t.created_at &&
                        " · " +
                          new Date(t.created_at).toLocaleDateString("en", {
                            month: "short",
                            day: "numeric",
                          })}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "14px",
                    alignItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: "0.88rem",
                      color:
                        t.habit_type === "continue" ? "#10b981" : "#ef4444",
                      fontWeight: "700",
                    }}
                  >
                    {t.duration}m
                  </div>
                  <Trash2
                    size={13}
                    className="trash-btn"
                    style={{ cursor: "pointer", opacity: 0.18 }}
                    onClick={() => deleteLog(t.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== ANALYTICS ===== */}
        {activeMenuSection === "analytics" && (
          <div className="fade-up">
            {/* Summary Row */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
              <StatCard
                icon={TrendingUp}
                label="Efficiency"
                value={`${briefingData.efficiency}`}
                unit="%"
                color="#3b82f6"
              />
              <StatCard
                icon={Flame}
                label="Streak"
                value={streak}
                unit=" days"
                color="#fbbf24"
              />
              <StatCard
                icon={Award}
                label="Logs"
                value={tasks.length}
                color="#8b5cf6"
              />
            </div>

            {/* Momentum Chart */}
            <div style={{ ...cardStyle, marginBottom: "14px" }}>
              <p
                style={{
                  margin: "0 0 18px",
                  fontSize: "0.62rem",
                  opacity: 0.4,
                  letterSpacing: "2px",
                }}
              >
                MOMENTUM SLOPE · BUILD vs STOP
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart
                  data={chartData}
                  margin={{ top: 10, right: 8, bottom: 0, left: -12 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="rgba(255,255,255,0.04)"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 9,
                      fill: "rgba(255,255,255,0.3)",
                      fontFamily: "Syne",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fontSize: 9,
                      fill: "rgba(255,255,255,0.3)",
                      fontFamily: "Syne",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      fontFamily: "Syne",
                      fontSize: "0.8rem",
                    }}
                    formatter={(val, _name, props) => [
                      `${val} min · ${
                        props.payload.type === "continue" ? "BUILD" : "STOP"
                      }`,
                      props.payload.subject,
                    ]}
                  />
                  <Bar dataKey="duration" barSize={22} radius={[6, 6, 0, 0]}>
                    {chartData.map((e, i) => (
                      <Cell
                        key={i}
                        fill={e.type === "continue" ? "#10b981" : "#ef4444"}
                        opacity={0.85}
                      />
                    ))}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="duration"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ fill: "#3b82f6", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: "#3b82f6" }}
                  />
                  <ReferenceLine
                    y={globalGoal}
                    stroke="#fbbf24"
                    strokeDasharray="6 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Goal: ${globalGoal}m`,
                      fill: "#fbbf24",
                      fontSize: 9,
                      position: "insideTopRight",
                      fontFamily: "Syne",
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  marginTop: "14px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                {[
                  ["#10b981", "Build"],
                  ["#ef4444", "Stop"],
                  ["#3b82f6", "Trend"],
                  ["#fbbf24", "Goal"],
                ].map(([c, l]) => (
                  <div
                    key={l}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.7rem",
                      opacity: 0.45,
                    }}
                  >
                    <div
                      style={{
                        width: "10px",
                        height: "3px",
                        background: c,
                        borderRadius: "2px",
                      }}
                    />
                    {l}
                  </div>
                ))}
              </div>
            </div>

            {/* Composition Pie */}
            <div style={cardStyle}>
              <p
                style={{
                  margin: "0 0 18px",
                  fontSize: "0.62rem",
                  opacity: 0.4,
                  letterSpacing: "2px",
                }}
              >
                SUBJECT COMPOSITION
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieSegments}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    stroke="none"
                    paddingAngle={4}
                  >
                    {pieSegments.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "10px",
                      fontFamily: "Syne",
                      fontSize: "0.8rem",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  justifyContent: "center",
                  marginTop: "8px",
                }}
              >
                {pieSegments.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.72rem",
                      opacity: 0.6,
                    }}
                  >
                    <div
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: s.color,
                      }}
                    />
                    {s.name} <span style={{ opacity: 0.5 }}>({s.value}m)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== TARGETS ===== */}
        {activeMenuSection === "targets" && (
          <div className="fade-up">
            {/* Goal Card */}
            <div style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                <Target size={18} color="#3b82f6" />
                <p
                  style={{
                    margin: 0,
                    fontWeight: "700",
                    fontSize: "1.1rem",
                  }}
                >
                  Daily Goal
                </p>
              </div>
              <p
                style={{
                  fontSize: "0.8rem",
                  opacity: 0.45,
                  marginBottom: "18px",
                  lineHeight: 1.6,
                }}
              >
                Your target productive minutes per day. The reference line on
                the Analytics chart updates automatically.
              </p>
              <label
                style={{
                  fontSize: "0.6rem",
                  opacity: 0.4,
                  letterSpacing: "2px",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                DAILY TARGET (MINUTES)
              </label>
              <input
                type="number"
                value={globalGoal}
                style={{
                  ...inputStyle,
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "1.6rem",
                  fontWeight: "700",
                  textAlign: "center",
                  marginBottom: "14px",
                }}
                onChange={(e) => setGlobalGoal(Number(e.target.value))}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                {[60, 90, 120, 180, 240].map((v) => (
                  <button
                    key={v}
                    onClick={() => setGlobalGoal(v)}
                    style={{
                      flex: 1,
                      padding: "10px 2px",
                      borderRadius: "10px",
                      background:
                        globalGoal === v ? "rgba(59,130,246,0.18)" : "#1e293b",
                      border:
                        globalGoal === v
                          ? "1px solid rgba(59,130,246,0.5)"
                          : "1px solid transparent",
                      color:
                        globalGoal === v ? "#3b82f6" : "rgba(255,255,255,0.4)",
                      cursor: "pointer",
                      fontSize: "0.72rem",
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: "700",
                      transition: "all 0.2s",
                    }}
                  >
                    {v}m
                  </button>
                ))}
              </div>
            </div>

            {/* Shield Card */}
            <div style={{ ...cardStyle, marginTop: "14px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "8px",
                    }}
                  >
                    <Shield
                      size={18}
                      color={shieldActive ? "#ef4444" : "#64748b"}
                    />
                    <span style={{ fontWeight: "700", fontSize: "1.05rem" }}>
                      Lambert Shield
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.8rem",
                      opacity: 0.45,
                      lineHeight: 1.5,
                    }}
                  >
                    Intercepts your #1 disruptor:{" "}
                    <strong style={{ color: "#ef4444" }}>
                      {briefingData.disruptor}
                    </strong>
                    . You'll be warned before logging it.
                  </p>
                </div>
                <div
                  onClick={() => setShieldActive(!shieldActive)}
                  style={{
                    width: "52px",
                    height: "28px",
                    borderRadius: "14px",
                    background: shieldActive ? "#ef4444" : "#334155",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.3s",
                    flexShrink: 0,
                    marginLeft: "20px",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "4px",
                      left: shieldActive ? "26px" : "4px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: "white",
                      transition: "left 0.28s cubic-bezier(0.34,1.56,0.64,1)",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== LOG HABIT MODAL ===== */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2,6,23,0.92)",
            zIndex: 3000,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: "16px",
            backdropFilter: "blur(6px)",
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="modal-slide"
            style={{
              width: "100%",
              maxWidth: "500px",
              background: "#0d1829",
              borderRadius: "28px 28px 20px 20px",
              padding: "30px 24px 36px",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 -20px 60px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "26px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontWeight: "800",
                    fontSize: "1.25rem",
                  }}
                >
                  Log Habit
                </h2>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "0.72rem",
                    opacity: 0.4,
                  }}
                >
                  Track a productive or disruptor habit
                </p>
              </div>
              <div
                onClick={() => setIsModalOpen(false)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#1e293b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={15} />
              </div>
            </div>

            {/* Shield Warning */}
            {briefingData.isThreat && (
              <div
                style={{
                  background: "rgba(239,68,68,0.09)",
                  border: "1px solid rgba(239,68,68,0.35)",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  marginBottom: "16px",
                  fontSize: "0.8rem",
                  color: "#f87171",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Shield size={13} />⚠ Lambert Shield: "{briefingData.disruptor}"
                is your top disruptor.
              </div>
            )}

            {/* Inputs */}
            <label
              style={{
                fontSize: "0.6rem",
                opacity: 0.4,
                letterSpacing: "2px",
                display: "block",
                marginBottom: "6px",
              }}
            >
              SUBJECT
            </label>
            <input
              placeholder="e.g. Deep Work, Social Media..."
              style={inputStyle}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              autoFocus
            />

            <label
              style={{
                fontSize: "0.6rem",
                opacity: 0.4,
                letterSpacing: "2px",
                display: "block",
                marginBottom: "6px",
              }}
            >
              DURATION (MINUTES)
            </label>
            <input
              placeholder="e.g. 60"
              type="number"
              style={inputStyle}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />

            <label
              style={{
                fontSize: "0.6rem",
                opacity: 0.4,
                letterSpacing: "2px",
                display: "block",
                marginBottom: "10px",
              }}
            >
              TYPE
            </label>
            <div style={{ display: "flex", gap: "10px", marginBottom: "22px" }}>
              {[
                ["continue", "🚀 Build", "#10b981"],
                ["stop", "⛔ Disruptor", "#ef4444"],
              ].map(([val, label, color]) => (
                <div
                  key={val}
                  onClick={() => setHabitType(val)}
                  style={{
                    flex: 1,
                    padding: "14px 8px",
                    borderRadius: "14px",
                    cursor: "pointer",
                    background: habitType === val ? `${color}18` : "#1a2742",
                    border: `1px solid ${
                      habitType === val ? color : "rgba(255,255,255,0.06)"
                    }`,
                    textAlign: "center",
                    fontWeight: "700",
                    fontSize: "0.88rem",
                    color: habitType === val ? color : "rgba(255,255,255,0.4)",
                    transition: "all 0.2s",
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Submit */}
            <button
              onClick={handleLogHabit}
              disabled={isLogging || !subject || !duration}
              style={{
                background:
                  !subject || !duration
                    ? "#1e293b"
                    : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                color:
                  !subject || !duration ? "rgba(255,255,255,0.25)" : "white",
                padding: "16px",
                borderRadius: "16px",
                border: "none",
                width: "100%",
                fontWeight: "700",
                cursor:
                  isLogging || !subject || !duration
                    ? "not-allowed"
                    : "pointer",
                fontSize: "0.95rem",
                fontFamily: "'Syne', sans-serif",
                letterSpacing: "0.5px",
                boxShadow:
                  subject && duration
                    ? "0 4px 28px rgba(59,130,246,0.25)"
                    : "none",
                transition: "all 0.25s",
              }}
            >
              {isLogging ? "Syncing to Hub..." : "Sync to Hub →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
