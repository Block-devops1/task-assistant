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
  Sun,
  Moon,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  AlertTriangle,
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
  Legend,
} from "recharts";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) console.error("MISSING SUPABASE ENV VARS");
const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder-key",
);

// ─── STACKED RINGS ─────────────────────────────────────────────────────────────
const StackedRings = ({ build, stop, globalGoal, isDark }) => {
  const size = 224,
    cx = size / 2,
    cy = size / 2;
  const goal = Math.max(1, globalGoal);
  const trk = isDark ? "#1e293b" : "#e2e8f0";
  const oR = 88,
    oSW = 14,
    oC = 2 * Math.PI * oR;
  const iR = 64,
    iSW = 12,
    iC = 2 * Math.PI * iR;
  const oA = Math.min(1, build / goal) * oC;
  const iA = Math.min(1, stop / goal) * iC;
  const total = build + stop;
  const eff =
    total > 0 ? Math.max(0, Math.round(((build - stop) / total) * 100)) : 0;
  const col = eff >= 85 ? "#10b981" : eff >= 50 ? "#3b82f6" : "#ef4444";
  const tr = "stroke-dasharray 1.3s cubic-bezier(0.34,1.56,0.64,1)";
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
        <circle
          cx={cx}
          cy={cy}
          r={oR}
          fill="none"
          stroke={trk}
          strokeWidth={oSW}
        />
        <circle
          cx={cx}
          cy={cy}
          r={oR}
          fill="none"
          stroke="#10b981"
          strokeWidth={oSW}
          strokeLinecap="round"
          strokeDasharray={`${oA} ${oC - oA}`}
          strokeDashoffset={0}
          style={{ transition: tr }}
        />
        <circle
          cx={cx}
          cy={cy}
          r={iR}
          fill="none"
          stroke={trk}
          strokeWidth={iSW}
        />
        <circle
          cx={cx}
          cy={cy}
          r={iR}
          fill="none"
          stroke="#ef4444"
          strokeWidth={iSW}
          strokeLinecap="round"
          strokeDasharray={`${iA} ${iC - iA}`}
          strokeDashoffset={0}
          style={{ transition: tr }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "2.5rem",
            fontWeight: "700",
            color: col,
            lineHeight: 1,
            transition: "color 0.5s",
          }}
        >
          {eff}%
        </div>
        <div
          style={{
            fontSize: "0.53rem",
            opacity: 0.35,
            letterSpacing: "2.5px",
            marginTop: "5px",
          }}
        >
          EFFICIENCY
        </div>
        <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "0.68rem",
              fontWeight: "700",
              color: "#10b981",
            }}
          >
            ▲{build}m
          </span>
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "0.68rem",
              fontWeight: "700",
              color: "#ef4444",
            }}
          >
            ▼{stop}m
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── STAT CARD ─────────────────────────────────────────────────────────────────
const StatCard = ({
  icon: Icon,
  label,
  value,
  color = "#3b82f6",
  unit = "",
  th,
  delta,
}) => (
  <div
    style={{
      background: th.statCard,
      borderRadius: "16px",
      padding: "14px 16px",
      border: `1px solid ${th.cardBorder}`,
      flex: 1,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "7px",
        marginBottom: "6px",
      }}
    >
      <Icon size={12} color={color} />
      <span
        style={{
          fontSize: "0.57rem",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: th.textMuted,
        }}
      >
        {label}
      </span>
    </div>
    <div
      style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: "1.35rem",
        fontWeight: "700",
        color,
      }}
    >
      {value}
      <span
        style={{ fontSize: "0.72rem", color: th.textMuted, marginLeft: "2px" }}
      >
        {unit}
      </span>
    </div>
    {delta !== undefined && (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "3px",
          marginTop: "4px",
          fontSize: "0.65rem",
          color: delta >= 0 ? "#10b981" : "#ef4444",
        }}
      >
        {delta >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
        {Math.abs(delta)}% vs last week
      </div>
    )}
  </div>
);

// ─── TOGGLE ────────────────────────────────────────────────────────────────────
const Toggle = ({ on, onToggle, activeColor = "#3b82f6", offColor }) => (
  <div
    onClick={onToggle}
    style={{
      width: "46px",
      height: "26px",
      borderRadius: "13px",
      background: on ? activeColor : offColor,
      cursor: "pointer",
      position: "relative",
      transition: "background 0.3s",
      flexShrink: 0,
    }}
  >
    <div
      style={{
        position: "absolute",
        top: "3px",
        left: on ? "23px" : "3px",
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        background: "white",
        boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
        transition: "left 0.28s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    />
  </div>
);

// ─── FILTER BAR ────────────────────────────────────────────────────────────────
const FilterBar = ({ value, onChange, th }) => (
  <div
    style={{
      display: "flex",
      gap: "6px",
      flexWrap: "wrap",
      marginBottom: "16px",
    }}
  >
    {[
      { id: "today", label: "Today" },
      { id: "week", label: "7 Days" },
      { id: "month", label: "30 Days" },
      { id: "year", label: "Year" },
      { id: "newest", label: "Newest" },
      { id: "maxtime", label: "Max Time" },
    ].map((f) => (
      <button
        key={f.id}
        onClick={() => onChange(f.id)}
        style={{
          padding: "7px 14px",
          borderRadius: "20px",
          border: "none",
          cursor: "pointer",
          fontSize: "0.73rem",
          fontWeight: "700",
          fontFamily: "'Syne', sans-serif",
          background: value === f.id ? "#3b82f6" : th.quickBtn,
          color: value === f.id ? "#fff" : th.textMuted,
          boxShadow:
            value === f.id ? "0 2px 12px rgba(59,130,246,0.3)" : "none",
          transition: "all 0.2s",
        }}
      >
        {f.label}
      </button>
    ))}
  </div>
);

// ─── HABIT RANK ────────────────────────────────────────────────────────────────
const HabitRank = ({ habits, type, th }) => (
  <div>
    <p
      style={{
        margin: "0 0 12px",
        fontSize: "0.6rem",
        color: th.textMuted,
        letterSpacing: "2px",
      }}
    >
      {type === "build" ? "🏆 TOP BUILD HABITS" : "⚠ TOP DISRUPTORS"}
    </p>
    {habits.length === 0 ? (
      <p style={{ fontSize: "0.8rem", color: th.textMuted, opacity: 0.5 }}>
        No data yet
      </p>
    ) : (
      habits.map(([name, mins], i) => (
        <div key={name} style={{ marginBottom: "12px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "5px",
            }}
          >
            <span
              style={{ fontSize: "0.82rem", fontWeight: "600", color: th.text }}
            >
              <span
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "0.65rem",
                  opacity: 0.4,
                  marginRight: "6px",
                }}
              >
                #{i + 1}
              </span>
              {name}
            </span>
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.78rem",
                fontWeight: "700",
                color: type === "build" ? "#10b981" : "#ef4444",
              }}
            >
              {mins}m
            </span>
          </div>
          <div
            style={{
              height: "4px",
              background: th.inputBg,
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: "2px",
                width: `${Math.round((mins / habits[0][1]) * 100)}%`,
                background:
                  type === "build"
                    ? "linear-gradient(90deg,#10b981,#059669)"
                    : "linear-gradient(90deg,#ef4444,#dc2626)",
                transition: "width 0.9s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            />
          </div>
        </div>
      ))
    )}
  </div>
);

// ─── APP ──────────────────────────────────────────────────────────────────────
const App = () => {
  // ── Core state ──
  const [session, setSession] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("home");
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
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [isDark, setIsDark] = useState(true);
  // ── New state ──
  const [filter, setFilter] = useState("week");
  const [goalText, setGoalText] = useState(""); // what you want to achieve
  const [goalSubject, setGoalSubject] = useState(""); // specific habit to track
  const [goalHabitType, setGoalHabitType] = useState("build"); // build or stop goal

  // ── Theme ──
  const th = isDark
    ? {
        bg: "#020617",
        card: "#0f172a",
        statCard: "#0f172a",
        cardBorder: "rgba(255,255,255,0.05)",
        inputBg: "#1e293b",
        inputBdr: "rgba(255,255,255,0.08)",
        text: "#ffffff",
        textMuted: "rgba(255,255,255,0.38)",
        menuBg: "#060e1c",
        menuBdr: "rgba(255,255,255,0.06)",
        modalBg: "#0b1628",
        logBg: "#0f172a",
        logBdr: "rgba(255,255,255,0.04)",
        selectBg: "#182234",
        navActive: "rgba(59,130,246,0.10)",
        navBdr: "rgba(59,130,246,0.22)",
        quickBtn: "#1e293b",
        switchOff: "#334155",
        briefBg: "rgba(59,130,246,0.05)",
        briefBdr: "rgba(59,130,246,0.18)",
        overlayBg: "rgba(2,6,23,0.88)",
        gridLine: "rgba(255,255,255,0.04)",
        insightBg: "rgba(255,255,255,0.03)",
      }
    : {
        bg: "#f0f4f8",
        card: "#ffffff",
        statCard: "#f8fafc",
        cardBorder: "rgba(0,0,0,0.07)",
        inputBg: "#f1f5f9",
        inputBdr: "rgba(0,0,0,0.10)",
        text: "#0f172a",
        textMuted: "rgba(15,23,42,0.42)",
        menuBg: "#ffffff",
        menuBdr: "rgba(0,0,0,0.06)",
        modalBg: "#ffffff",
        logBg: "#ffffff",
        logBdr: "rgba(0,0,0,0.05)",
        selectBg: "#f1f5f9",
        navActive: "rgba(59,130,246,0.07)",
        navBdr: "rgba(59,130,246,0.20)",
        quickBtn: "#f1f5f9",
        switchOff: "#cbd5e1",
        briefBg: "rgba(59,130,246,0.04)",
        briefBdr: "rgba(59,130,246,0.20)",
        overlayBg: "rgba(10,20,40,0.72)",
        gridLine: "rgba(0,0,0,0.06)",
        insightBg: "rgba(0,0,0,0.025)",
      };

  // ── CSS + font injection ──
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    const style = document.createElement("style");
    style.id = "lambert-css";
    style.textContent = `
      *,*::before,*::after{box-sizing:border-box}
      body{margin:0;font-family:'Syne',sans-serif}
      @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
      @keyframes slideInLeft{from{opacity:0;transform:translateX(-100%)}to{opacity:1;transform:translateX(0)}}
      @keyframes slideUpModal{from{opacity:0;transform:translateY(50px)}to{opacity:1;transform:translateY(0)}}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes flameDance{0%,100%{transform:scaleY(1) rotate(-3deg)}50%{transform:scaleY(1.12) rotate(3deg)}}
      @keyframes shieldPulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)}50%{box-shadow:0 0 0 8px rgba(239,68,68,0)}}
      .fu {animation:fadeUp .55s cubic-bezier(.16,1,.3,1) both}
      .fu1{animation:fadeUp .55s .06s cubic-bezier(.16,1,.3,1) both}
      .fu2{animation:fadeUp .55s .12s cubic-bezier(.16,1,.3,1) both}
      .fu3{animation:fadeUp .55s .18s cubic-bezier(.16,1,.3,1) both}
      .fu4{animation:fadeUp .55s .24s cubic-bezier(.16,1,.3,1) both}
      .fu5{animation:fadeUp .55s .30s cubic-bezier(.16,1,.3,1) both}
      .menu-in {animation:slideInLeft  .32s cubic-bezier(.16,1,.3,1) both}
      .modal-up{animation:slideUpModal .36s cubic-bezier(.16,1,.3,1) both}
      .sp{animation:shieldPulse 2s ease-in-out infinite}
      button{font-family:'Syne',sans-serif;transition:transform .12s,opacity .12s}
      button:active{transform:scale(.97)!important}
      input:focus,select:focus,textarea:focus{outline:none!important;border-color:#3b82f6!important;box-shadow:0 0 0 3px rgba(59,130,246,.15)!important}
      ::-webkit-scrollbar{width:3px}
      ::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:#334155;border-radius:3px}
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(link);
      const s = document.getElementById("lambert-css");
      if (s) document.head.removeChild(s);
    };
  }, []);

  useEffect(() => {
    document.body.style.background = th.bg;
  }, [isDark]); // eslint-disable-line

  // ── Auth ──
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (session) fetchLogs();
  }, [session]); // eslint-disable-line

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("habit_logs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error(error.message);
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
      if (isSignUp) alert("Confirmation email sent!");
    } catch (err) {
      alert("Auth Error: " + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // ── Base analytics (all-time, for dashboard) ──
  const analytics = useMemo(() => {
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
    return { build, stop, total, efficiency, disruptor, isThreat };
  }, [tasks, subject, habitType, shieldActive]);

  // ── Streak ──
  const streak = useMemo(() => {
    if (!tasks.length) return 0;
    const dates = [...new Set(tasks.map((t) => t.created_at?.split("T")[0]))]
      .sort()
      .reverse();
    let count = 0,
      check = new Date().toISOString().split("T")[0];
    for (const d of dates) {
      if (d === check) {
        count++;
        const dt = new Date(check);
        dt.setDate(dt.getDate() - 1);
        check = dt.toISOString().split("T")[0];
      } else if (d < check) break;
    }
    return count;
  }, [tasks]);

  // ── Filtered tasks (for analytics page) ──
  const filteredTasks = useMemo(() => {
    const now = Date.now();
    const ms = (days) => days * 86400000;
    switch (filter) {
      case "today":
        return tasks.filter(
          (t) =>
            new Date(t.created_at).toDateString() === new Date().toDateString(),
        );
      case "week":
        return tasks.filter(
          (t) => now - new Date(t.created_at).getTime() <= ms(7),
        );
      case "month":
        return tasks.filter(
          (t) => now - new Date(t.created_at).getTime() <= ms(30),
        );
      case "year":
        return tasks.filter(
          (t) => now - new Date(t.created_at).getTime() <= ms(365),
        );
      case "newest":
        return tasks.slice(0, 25);
      case "maxtime":
        return [...tasks].sort((a, b) => b.duration - a.duration).slice(0, 25);
      default:
        return tasks;
    }
  }, [tasks, filter]);

  // ── Grouped chart data based on filter ──
  const chartData = useMemo(() => {
    const groupBy = (keyFn, labelFn) => {
      const agg = {};
      filteredTasks.forEach((t) => {
        const k = keyFn(t);
        if (!agg[k]) agg[k] = { _key: k, build: 0, stop: 0 };
        if (t.habit_type === "continue") agg[k].build += t.duration;
        else agg[k].stop += t.duration;
      });
      return Object.values(agg)
        .sort((a, b) => a._key.localeCompare(b._key))
        .map((d) => ({ ...d, name: labelFn(d._key) }));
    };

    if (filter === "year") {
      return groupBy(
        (t) => t.created_at?.slice(0, 7),
        (k) =>
          new Date(k + "-01").toLocaleDateString("en", {
            month: "short",
            year: "2-digit",
          }),
      );
    }
    if (filter === "month" || filter === "week") {
      return groupBy(
        (t) => t.created_at?.split("T")[0],
        (k) =>
          new Date(k + "T12:00:00").toLocaleDateString("en", {
            month: "short",
            day: "numeric",
          }),
      );
    }
    if (filter === "today") {
      return groupBy(
        (t) => t.created_at?.slice(0, 13),
        (k) => k.slice(11) + ":00",
      );
    }
    // newest / maxtime — individual entries
    const src =
      filter === "maxtime"
        ? [...filteredTasks].sort((a, b) => b.duration - a.duration)
        : [...filteredTasks];
    return src.map((t, i) => ({
      name: t.created_at
        ? new Date(t.created_at).toLocaleDateString("en", {
            month: "short",
            day: "numeric",
          })
        : `#${i + 1}`,
      build: t.habit_type === "continue" ? t.duration : 0,
      stop: t.habit_type === "stop" ? t.duration : 0,
      subject: t.subject,
      type: t.habit_type,
    }));
  }, [filteredTasks, filter]);

  // ── Average for filtered period reference line ──
  const filterAvg = useMemo(() => {
    if (!["week", "month", "year"].includes(filter) || !chartData.length)
      return null;
    const totalBuild = chartData.reduce((s, d) => s + d.build, 0);
    return Math.round(totalBuild / chartData.length);
  }, [chartData, filter]);

  // ── Filter summary label ──
  const filterLabel = {
    today: "Today",
    week: "Last 7 Days",
    month: "Last 30 Days",
    year: "This Year",
    newest: "Newest 25",
    maxtime: "Highest Duration",
  }[filter];

  // ── Filtered stats ──
  const filteredStats = useMemo(() => {
    const build = filteredTasks
      .filter((t) => t.habit_type === "continue")
      .reduce((s, t) => s + t.duration, 0);
    const stop = filteredTasks
      .filter((t) => t.habit_type === "stop")
      .reduce((s, t) => s + t.duration, 0);
    const total = build + stop;
    const eff =
      total === 0 ? 0 : Math.max(0, Math.round(((build - stop) / total) * 100));
    return { build, stop, total, eff };
  }, [filteredTasks]);

  // ── Deep analytics (all-time) ──
  const deepAnalytics = useMemo(() => {
    // Top build/stop habits by total minutes
    const buildAgg = {},
      stopAgg = {};
    tasks.forEach((t) => {
      if (t.habit_type === "continue")
        buildAgg[t.subject] = (buildAgg[t.subject] || 0) + t.duration;
      else stopAgg[t.subject] = (stopAgg[t.subject] || 0) + t.duration;
    });
    const topBuild = Object.entries(buildAgg)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const topStop = Object.entries(stopAgg)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Consistency rate
    const allDates = tasks
      .map((t) => t.created_at?.split("T")[0])
      .filter(Boolean);
    const uniqueDays = new Set(allDates).size;
    const firstDate = allDates.length
      ? new Date(allDates[allDates.length - 1])
      : new Date();
    const daysSince = Math.max(
      1,
      Math.round((Date.now() - firstDate.getTime()) / 86400000),
    );
    const consistency = Math.min(
      100,
      Math.round((uniqueDays / daysSince) * 100),
    );

    // This week vs last week build time
    const now = Date.now();
    const weekMs = 7 * 86400000;
    const thisWeek = tasks
      .filter(
        (t) =>
          t.habit_type === "continue" &&
          now - new Date(t.created_at).getTime() <= weekMs,
      )
      .reduce((s, t) => s + t.duration, 0);
    const lastWeek = tasks
      .filter(
        (t) =>
          t.habit_type === "continue" &&
          now - new Date(t.created_at).getTime() > weekMs &&
          now - new Date(t.created_at).getTime() <= 2 * weekMs,
      )
      .reduce((s, t) => s + t.duration, 0);
    const weekDelta =
      lastWeek === 0
        ? thisWeek > 0
          ? 100
          : 0
        : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);

    // Best day of week for build
    const dayAgg = {};
    tasks
      .filter((t) => t.habit_type === "continue")
      .forEach((t) => {
        const day = new Date(t.created_at).toLocaleDateString("en", {
          weekday: "short",
        });
        dayAgg[day] = (dayAgg[day] || 0) + t.duration;
      });
    const bestDay =
      Object.entries(dayAgg).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    // All-time best streak
    const sortedDates = [
      ...new Set(tasks.map((t) => t.created_at?.split("T")[0]).filter(Boolean)),
    ].sort();
    let maxStreak = 0,
      cur = 0,
      prev = null;
    for (const d of sortedDates) {
      if (prev) {
        const diff = (new Date(d) - new Date(prev)) / 86400000;
        cur = diff === 1 ? cur + 1 : 1;
      } else cur = 1;
      maxStreak = Math.max(maxStreak, cur);
      prev = d;
    }

    // Win rate: days where build > stop
    const byDay = {};
    tasks.forEach((t) => {
      const day = t.created_at?.split("T")[0];
      if (!day) return;
      if (!byDay[day]) byDay[day] = { build: 0, stop: 0 };
      if (t.habit_type === "continue") byDay[day].build += t.duration;
      else byDay[day].stop += t.duration;
    });
    const days = Object.values(byDay);
    const wins = days.filter((d) => d.build > d.stop).length;
    const winRate =
      days.length === 0 ? 0 : Math.round((wins / days.length) * 100);

    // Avg session length
    const avgSession =
      tasks.length === 0
        ? 0
        : Math.round(tasks.reduce((s, t) => s + t.duration, 0) / tasks.length);

    return {
      topBuild,
      topStop,
      consistency,
      thisWeek,
      lastWeek,
      weekDelta,
      bestDay,
      maxStreak,
      winRate,
      avgSession,
    };
  }, [tasks]);

  // ── Pie segments (build habits) ──
  const pieSegments = useMemo(() => {
    const bt = tasks.filter((t) => t.habit_type === "continue");
    if (!bt.length) return [{ name: "No data", value: 1, color: "#1e293b" }];
    const agg = bt.reduce((acc, t) => {
      acc[t.subject] = (acc[t.subject] || 0) + t.duration;
      return acc;
    }, {});
    return Object.entries(agg).map(([name, value], i) => ({
      name,
      value,
      color: ["#3b82f6", "#10b981", "#8b5cf6", "#fbbf24", "#f43f5e"][i % 5],
    }));
  }, [tasks]);

  // ── AI Briefing ──
  const fetchAI = useCallback(async () => {
    setAiLoading(true);
    const { efficiency, build, stop, disruptor } = analytics;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `You are Lambert, a sharp AI executive coach. Write a crisp 2-sentence tactical briefing (35 words max) for: Efficiency ${efficiency}%, Build ${build}min, Stop ${stop}min, Top disruptor "${disruptor}", Streak ${streak} days, Consistency ${deepAnalytics.consistency}%, Win rate ${deepAnalytics.winRate}%. Be direct. No filler.`,
            },
          ],
        }),
      });
      const data = await res.json();
      setAiText(data.content?.[0]?.text || "");
    } catch {
      setAiText(
        efficiency >= 85
          ? `Efficiency at ${efficiency}%. Core stable—maintain vector.`
          : `${efficiency}% efficiency. Variance detected. Recalibrate disruptors.`,
      );
    } finally {
      setAiLoading(false);
    }
  }, [analytics, streak, deepAnalytics.consistency, deepAnalytics.winRate]);

  useEffect(() => {
    if (session && tasks.length > 0) fetchAI();
  }, [tasks.length, session]); // eslint-disable-line

  const handleLogHabit = async () => {
    if (!subject || !duration) return;
    if (
      analytics.isThreat &&
      !window.confirm(
        `⚠ Lambert Shield: "${analytics.disruptor}" is your #1 disruptor. Log anyway?`,
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
    if (error) alert(error.message);
    else {
      fetchLogs();
      setIsModalOpen(false);
      setSubject("");
      setDuration("");
      setHabitType("continue");
    }
    setIsLogging(false);
  };

  // ── Style helpers ──
  const inp = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    background: th.inputBg,
    color: th.text,
    border: `1px solid ${th.inputBdr}`,
    marginBottom: "12px",
    fontSize: "0.95rem",
    fontFamily: "'Syne',sans-serif",
    transition: "border-color .2s,box-shadow .2s",
  };
  const card = {
    background: th.card,
    borderRadius: "20px",
    padding: "24px",
    border: `1px solid ${th.cardBorder}`,
  };
  const card16 = {
    background: th.card,
    borderRadius: "16px",
    padding: "18px",
    border: `1px solid ${th.cardBorder}`,
  };
  const iBtn = {
    width: "42px",
    height: "42px",
    borderRadius: "13px",
    background: th.card,
    border: `1px solid ${th.cardBorder}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };
  const ttip = {
    background: th.card,
    border: `1px solid ${th.cardBorder}`,
    borderRadius: "12px",
    fontFamily: "Syne",
    fontSize: "0.8rem",
    color: th.text,
  };

  // ════════════════════════════════ AUTH ════════════════════════════════
  if (!session)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: th.bg,
          color: th.text,
          fontFamily: "'Syne',sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {isDark && (
          <>
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0.025,
                backgroundImage:
                  "linear-gradient(rgba(59,130,246,1) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,1) 1px,transparent 1px)",
                backgroundSize: "44px 44px",
              }}
            />
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
                  "radial-gradient(circle,rgba(59,130,246,.09) 0%,transparent 70%)",
                pointerEvents: "none",
              }}
            />
          </>
        )}
        <div
          className="fu"
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
            <Zap size={34} color="#fbbf24" />
            <h1
              style={{
                margin: 0,
                fontSize: "2.4rem",
                fontWeight: "800",
                letterSpacing: "5px",
                color: th.text,
              }}
            >
              LAMBERT
            </h1>
          </div>
          <p
            style={{
              margin: 0,
              color: th.textMuted,
              fontSize: "0.68rem",
              letterSpacing: "4px",
            }}
          >
            EXECUTIVE HABIT ENGINE
          </p>
        </div>
        <form
          onSubmit={handleAuth}
          className="fu"
          style={{ width: "100%", maxWidth: "360px" }}
        >
          <div style={{ position: "relative" }}>
            <Mail
              size={14}
              style={{
                position: "absolute",
                left: "16px",
                top: "16px",
                color: th.textMuted,
              }}
            />
            <input
              placeholder="Email address"
              type="email"
              style={{ ...inp, paddingLeft: "44px" }}
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
                color: th.textMuted,
              }}
            />
            <input
              placeholder="Password"
              type="password"
              style={{ ...inp, paddingLeft: "44px" }}
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
                : "linear-gradient(135deg,#3b82f6,#1d4ed8)",
              color: "#fff",
              padding: "16px",
              borderRadius: "14px",
              border: "none",
              width: "100%",
              fontWeight: "700",
              cursor: authLoading ? "not-allowed" : "pointer",
              fontSize: "0.9rem",
              letterSpacing: "1.5px",
              boxShadow: authLoading
                ? "none"
                : "0 4px 28px rgba(59,130,246,.3)",
            }}
          >
            {authLoading
              ? "AUTHENTICATING..."
              : isSignUp
                ? "CREATE ACCOUNT"
                : "ACCESS HUB"}
          </button>
          <p
            onClick={() => setIsSignUp((v) => !v)}
            style={{
              textAlign: "center",
              marginTop: "22px",
              fontSize: "0.8rem",
              color: th.textMuted,
              cursor: "pointer",
            }}
          >
            {isSignUp ? "Have an account? Sign In" : "New here? Register"}
          </p>
        </form>
      </div>
    );

  // ════════════════════════════════ MAIN HUB ════════════════════════════════
  return (
    <div
      style={{
        background: th.bg,
        color: th.text,
        minHeight: "100vh",
        fontFamily: "'Syne',sans-serif",
      }}
    >
      {/* ── DRAWER ── */}
      {isMenuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: th.overlayBg,
            WebkitBackdropFilter: "blur(5px)",
            backdropFilter: "blur(5px)",
          }}
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="menu-in"
            style={{
              width: "290px",
              background: th.menuBg,
              height: "100%",
              borderRight: `1px solid ${th.menuBdr}`,
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "32px 24px 20px",
                borderBottom: `1px solid ${th.menuBdr}`,
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
                      color: th.text,
                    }}
                  >
                    LAMBERT
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.62rem",
                    color: th.textMuted,
                  }}
                >
                  {session.user.email}
                </p>
              </div>
              <X
                size={18}
                onClick={() => setIsMenuOpen(false)}
                style={{ cursor: "pointer", color: th.textMuted }}
              />
            </div>
            <div style={{ padding: "18px 14px", flex: 1 }}>
              {[
                { id: "home", icon: Home, label: "Dashboard" },
                { id: "analytics", icon: BarChart2, label: "Analytics Hub" },
                { id: "targets", icon: Target, label: "Goals & Settings" },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
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
                      activeTab === item.id ? th.navActive : "transparent",
                    border: `1px solid ${activeTab === item.id ? th.navBdr : "transparent"}`,
                    color: activeTab === item.id ? "#3b82f6" : th.text,
                    transition: "all .15s",
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
                    <span style={{ fontWeight: "600", fontSize: "0.92rem" }}>
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight size={13} color={th.textMuted} />
                </div>
              ))}
            </div>
            <div
              style={{
                padding: "18px 24px",
                borderTop: `1px solid ${th.menuBdr}`,
                display: "flex",
                flexDirection: "column",
                gap: "18px",
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
                    color: th.textMuted,
                  }}
                >
                  {isDark ? <Moon size={14} /> : <Sun size={14} />}
                  <span style={{ fontSize: "0.82rem" }}>
                    {isDark ? "Dark Mode" : "Light Mode"}
                  </span>
                </div>
                <Toggle
                  on={isDark}
                  onToggle={() => setIsDark((v) => !v)}
                  activeColor="#3b82f6"
                  offColor={th.switchOff}
                />
              </div>
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
                    color: th.textMuted,
                  }}
                >
                  <Shield
                    size={14}
                    color={shieldActive ? "#ef4444" : undefined}
                  />
                  <span style={{ fontSize: "0.82rem" }}>Lambert Shield</span>
                </div>
                <Toggle
                  on={shieldActive}
                  onToggle={() => setShieldActive((v) => !v)}
                  activeColor="#ef4444"
                  offColor={th.switchOff}
                />
              </div>
            </div>
            <div style={{ padding: "0 24px 30px" }}>
              <div
                onClick={() => supabase.auth.signOut()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: th.textMuted,
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  padding: "10px 0",
                }}
              >
                <LogOut size={13} /> Sign Out
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENT ── */}
      <div
        style={{ maxWidth: "820px", margin: "0 auto", padding: "0 18px 100px" }}
      >
        <header
          style={{
            padding: "22px 0 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={iBtn} onClick={() => setIsMenuOpen(true)}>
            <Menu size={17} color={th.text} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "0.53rem",
                color: th.textMuted,
                letterSpacing: "3px",
                marginBottom: "2px",
              }}
            >
              LAMBERT ENGINE
            </div>
            <div
              style={{ fontWeight: "800", fontSize: "0.95rem", color: th.text }}
            >
              {activeTab === "home"
                ? "Executive HUB"
                : activeTab === "analytics"
                  ? "Analytics HUB"
                  : "Goals & Settings"}
            </div>
          </div>
          <div style={iBtn} onClick={() => supabase.auth.signOut()}>
            <LogOut size={15} color={th.textMuted} />
          </div>
        </header>

        {/* ════ DASHBOARD ════ */}
        {activeTab === "home" && (
          <div>
            {/* AI Briefing */}
            <div
              className={`fu1 ${analytics.isThreat ? "sp" : ""}`}
              style={{
                background: analytics.isThreat
                  ? "rgba(239,68,68,.07)"
                  : th.briefBg,
                border: `1px solid ${analytics.isThreat ? "rgba(239,68,68,.28)" : th.briefBdr}`,
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
                      fontSize: "0.57rem",
                      color: "#fbbf24",
                      letterSpacing: "2.5px",
                      fontWeight: "700",
                    }}
                  >
                    AI BRIEFING
                  </span>
                  {analytics.isThreat && (
                    <span
                      style={{
                        fontSize: "0.54rem",
                        color: "#ef4444",
                        fontWeight: "700",
                        background: "rgba(239,68,68,.15)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      ⚠ SHIELD
                    </span>
                  )}
                </div>
                <button
                  onClick={fetchAI}
                  disabled={aiLoading}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: aiLoading ? "not-allowed" : "pointer",
                    color: th.textMuted,
                    display: "flex",
                    alignItems: "center",
                    padding: "4px",
                  }}
                >
                  <RefreshCw
                    size={12}
                    style={{
                      animation: aiLoading ? "spin 1s linear infinite" : "none",
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
                  color: th.text,
                  opacity: aiLoading ? 0.45 : 1,
                  transition: "opacity .3s",
                }}
              >
                {aiLoading ? (
                  <span style={{ color: th.textMuted }}>
                    Calibrating executive briefing...
                  </span>
                ) : (
                  `"${aiText || (analytics.efficiency >= 85 ? `Efficiency at ${analytics.efficiency}%. Core stable.` : `${analytics.efficiency}% efficiency. Recalibrate disruptors.`)}"`
                )}
              </p>
            </div>

            {/* Goal Card (if set) */}
            {goalText && (
              <div
                className="fu1"
                style={{
                  ...card16,
                  marginBottom: "14px",
                  borderLeft: `3px solid ${goalHabitType === "build" ? "#10b981" : "#ef4444"}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.58rem",
                        color:
                          goalHabitType === "build" ? "#10b981" : "#ef4444",
                        letterSpacing: "2px",
                        fontWeight: "700",
                        marginBottom: "4px",
                      }}
                    >
                      {goalHabitType === "build" ? "BUILD GOAL" : "STOP GOAL"}
                    </div>
                    <div
                      style={{
                        fontWeight: "700",
                        fontSize: "1rem",
                        color: th.text,
                      }}
                    >
                      {goalText}
                    </div>
                    {goalSubject && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: th.textMuted,
                          marginTop: "2px",
                        }}
                      >
                        Tracking:{" "}
                        <strong style={{ color: th.text }}>
                          {goalSubject}
                        </strong>
                      </div>
                    )}
                  </div>
                  <Star size={16} color="#fbbf24" />
                </div>
                <div
                  style={{
                    fontSize: "0.65rem",
                    color: th.textMuted,
                    marginBottom: "6px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Daily target progress</span>
                  <span style={{ fontFamily: "'Space Mono',monospace" }}>
                    {Math.min(analytics.build, globalGoal)}/{globalGoal}m
                  </span>
                </div>
                <div
                  style={{
                    height: "5px",
                    background: th.inputBg,
                    borderRadius: "3px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: "3px",
                      background: "linear-gradient(90deg,#10b981,#059669)",
                      width: `${Math.min(100, (analytics.build / Math.max(1, globalGoal)) * 100)}%`,
                      transition: "width 1.2s cubic-bezier(.34,1.56,.64,1)",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Stacked Rings */}
            <div
              className="fu2"
              style={{ ...card, textAlign: "center", marginBottom: "14px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "24px",
                  marginBottom: "18px",
                }}
              >
                {[
                  {
                    color: "#10b981",
                    label: "Build vs Goal",
                    sub: "outer ring",
                  },
                  {
                    color: "#ef4444",
                    label: "Stop vs Goal",
                    sub: "inner ring",
                  },
                ].map(({ color, label, sub }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: color,
                      }}
                    />
                    <div style={{ textAlign: "left" }}>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: th.text,
                          fontWeight: "600",
                        }}
                      >
                        {label}
                      </div>
                      <div style={{ fontSize: "0.57rem", color: th.textMuted }}>
                        {sub}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <StackedRings
                build={analytics.build}
                stop={analytics.stop}
                globalGoal={globalGoal}
                isDark={isDark}
              />
              <div style={{ marginTop: "18px", marginBottom: "4px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.62rem",
                    color: th.textMuted,
                    marginBottom: "6px",
                  }}
                >
                  <span>Build progress toward daily goal</span>
                  <span style={{ fontFamily: "'Space Mono',monospace" }}>
                    {Math.min(analytics.build, globalGoal)}/{globalGoal}m
                  </span>
                </div>
                <div
                  style={{
                    height: "5px",
                    background: th.inputBg,
                    borderRadius: "3px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: "3px",
                      background: "linear-gradient(90deg,#10b981,#059669)",
                      width: `${Math.min(100, (analytics.build / Math.max(1, globalGoal)) * 100)}%`,
                      transition: "width 1.2s cubic-bezier(.34,1.56,.64,1)",
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <StatCard
                  icon={TrendingUp}
                  label="Build"
                  value={analytics.build}
                  unit="m"
                  color="#10b981"
                  th={th}
                />
                <StatCard
                  icon={Activity}
                  label="Stop"
                  value={analytics.stop}
                  unit="m"
                  color="#ef4444"
                  th={th}
                />
                <StatCard
                  icon={Clock}
                  label="Total"
                  value={analytics.total}
                  unit="m"
                  color="#3b82f6"
                  th={th}
                />
              </div>
            </div>

            {/* Quick Stats Row */}
            <div
              className="fu3"
              style={{ display: "flex", gap: "12px", marginBottom: "14px" }}
            >
              <div
                style={{
                  ...card,
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "13px",
                  padding: "18px 20px",
                }}
              >
                <span
                  style={{
                    fontSize: "2rem",
                    display: "inline-block",
                    animation:
                      streak > 0
                        ? "flameDance 2.2s ease-in-out infinite"
                        : "none",
                  }}
                >
                  🔥
                </span>
                <div>
                  <div
                    style={{
                      fontSize: "0.55rem",
                      color: th.textMuted,
                      letterSpacing: "2px",
                    }}
                  >
                    STREAK
                  </div>
                  <div
                    style={{
                      fontFamily: "'Space Mono',monospace",
                      fontSize: "1.5rem",
                      fontWeight: "700",
                      color: "#fbbf24",
                    }}
                  >
                    {streak}
                    <span
                      style={{
                        fontSize: "0.68rem",
                        color: th.textMuted,
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
                  ...card,
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "13px",
                  padding: "18px 20px",
                }}
              >
                <BookOpen size={20} color="#8b5cf6" style={{ flexShrink: 0 }} />
                <div>
                  <div
                    style={{
                      fontSize: "0.55rem",
                      color: th.textMuted,
                      letterSpacing: "2px",
                    }}
                  >
                    WIN RATE
                  </div>
                  <div
                    style={{
                      fontFamily: "'Space Mono',monospace",
                      fontSize: "1.5rem",
                      fontWeight: "700",
                      color: "#8b5cf6",
                    }}
                  >
                    {deepAnalytics.winRate}
                    <span
                      style={{
                        fontSize: "0.68rem",
                        color: th.textMuted,
                        marginLeft: "2px",
                      }}
                    >
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Insight Pills */}
            <div
              className="fu4"
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginBottom: "14px",
              }}
            >
              {[
                { icon: "📅", label: "Best Day", value: deepAnalytics.bestDay },
                {
                  icon: "🏆",
                  label: "Best Streak",
                  value: `${deepAnalytics.maxStreak}d`,
                },
                {
                  icon: "📊",
                  label: "Consistency",
                  value: `${deepAnalytics.consistency}%`,
                },
                {
                  icon: "⏱",
                  label: "Avg Session",
                  value: `${deepAnalytics.avgSession}m`,
                },
              ].map(({ icon, label, value }) => (
                <div
                  key={label}
                  style={{
                    background: th.insightBg,
                    border: `1px solid ${th.cardBorder}`,
                    borderRadius: "12px",
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>{icon}</span>
                  <div>
                    <div
                      style={{
                        fontSize: "0.58rem",
                        color: th.textMuted,
                        letterSpacing: "1px",
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Space Mono',monospace",
                        fontSize: "0.88rem",
                        fontWeight: "700",
                        color: th.text,
                      }}
                    >
                      {value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Subject Pie */}
            {tasks.filter((t) => t.habit_type === "continue").length > 0 && (
              <div className="fu4" style={{ ...card, marginBottom: "14px" }}>
                <p
                  style={{
                    margin: "0 0 14px",
                    fontSize: "0.6rem",
                    color: th.textMuted,
                    letterSpacing: "2px",
                  }}
                >
                  SUBJECT BREAKDOWN
                </p>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={pieSegments}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={62}
                      stroke="none"
                      paddingAngle={5}
                    >
                      {pieSegments.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={ttip} />
                  </PieChart>
                </ResponsiveContainer>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    justifyContent: "center",
                    marginTop: "6px",
                  }}
                >
                  {pieSegments.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "0.7rem",
                        color: th.textMuted,
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
                      {s.name}{" "}
                      <span style={{ opacity: 0.6 }}>({s.value}m)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Log Button */}
            <button
              className="fu5"
              onClick={() => setIsModalOpen(true)}
              style={{
                background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
                color: "#fff",
                padding: "17px",
                borderRadius: "16px",
                border: "none",
                width: "100%",
                fontWeight: "700",
                cursor: "pointer",
                fontSize: "0.95rem",
                letterSpacing: "0.5px",
                boxShadow: "0 4px 28px rgba(59,130,246,.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "28px",
              }}
            >
              <Plus size={17} /> Log New Habit
            </button>

            {/* System Logs */}
            <p
              style={{
                fontSize: "0.6rem",
                color: th.textMuted,
                marginBottom: "12px",
                letterSpacing: "2px",
              }}
            >
              SYSTEM LOGS ({tasks.length})
            </p>
            {tasks.length === 0 && (
              <div
                style={{
                  ...card,
                  textAlign: "center",
                  padding: "44px",
                  opacity: 0.35,
                }}
              >
                <Activity size={26} style={{ marginBottom: "10px" }} />
                <p style={{ margin: 0, fontSize: "0.9rem" }}>
                  No habits logged yet.
                </p>
              </div>
            )}
            {tasks.slice(0, 10).map((tk, idx) => (
              <div
                key={tk.id}
                style={{
                  background: th.logBg,
                  padding: "13px 15px",
                  borderRadius: "14px",
                  marginBottom: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: `1px solid ${th.logBdr}`,
                  animation: `fadeUp .4s ${idx * 0.04}s both`,
                }}
              >
                <div
                  style={{ display: "flex", gap: "11px", alignItems: "center" }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "10px",
                      flexShrink: 0,
                      background:
                        tk.habit_type === "continue"
                          ? "rgba(16,185,129,.1)"
                          : "rgba(239,68,68,.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Activity
                      size={13}
                      color={
                        tk.habit_type === "continue" ? "#10b981" : "#ef4444"
                      }
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: "600",
                        fontSize: "0.88rem",
                        color: th.text,
                      }}
                    >
                      {tk.subject}
                    </div>
                    <div
                      style={{
                        fontSize: "0.6rem",
                        color: th.textMuted,
                        marginTop: "2px",
                      }}
                    >
                      {tk.habit_type === "continue" ? "BUILD" : "STOP"}
                      {tk.created_at &&
                        " · " +
                          new Date(tk.created_at).toLocaleDateString("en", {
                            month: "short",
                            day: "numeric",
                          })}
                    </div>
                  </div>
                </div>
                <div
                  style={{ display: "flex", gap: "14px", alignItems: "center" }}
                >
                  <span
                    style={{
                      fontFamily: "'Space Mono',monospace",
                      fontSize: "0.88rem",
                      fontWeight: "700",
                      color:
                        tk.habit_type === "continue" ? "#10b981" : "#ef4444",
                    }}
                  >
                    {tk.duration}m
                  </span>
                  <Trash2
                    size={13}
                    style={{
                      cursor: "pointer",
                      color: th.textMuted,
                      opacity: 0.4,
                    }}
                    onClick={() => deleteLog(tk.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ════ ANALYTICS ════ */}
        {activeTab === "analytics" && (
          <div className="fu">
            {/* Filter Bar */}
            <FilterBar value={filter} onChange={setFilter} th={th} />

            {/* Filter label + summary */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
                padding: "12px 16px",
                background: th.insightBg,
                borderRadius: "12px",
                border: `1px solid ${th.cardBorder}`,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.6rem",
                    color: th.textMuted,
                    letterSpacing: "1.5px",
                  }}
                >
                  {filterLabel.toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "700",
                    color: th.text,
                    marginTop: "2px",
                    fontFamily: "'Space Mono',monospace",
                  }}
                >
                  <span style={{ color: "#10b981" }}>
                    ▲{filteredStats.build}m
                  </span>
                  <span style={{ color: th.textMuted, margin: "0 6px" }}>
                    ·
                  </span>
                  <span style={{ color: "#ef4444" }}>
                    ▼{filteredStats.stop}m
                  </span>
                  <span style={{ color: th.textMuted, margin: "0 6px" }}>
                    ·
                  </span>
                  <span style={{ color: "#3b82f6" }}>
                    {filteredStats.eff}% eff
                  </span>
                </div>
              </div>
              {filterAvg !== null && (
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "0.58rem",
                      color: th.textMuted,
                      letterSpacing: "1px",
                    }}
                  >
                    AVG BUILD
                  </div>
                  <div
                    style={{
                      fontFamily: "'Space Mono',monospace",
                      fontSize: "1rem",
                      fontWeight: "700",
                      color: "#fbbf24",
                    }}
                  >
                    {filterAvg}m
                  </div>
                </div>
              )}
            </div>

            {/* Stat cards for filtered period */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
              <StatCard
                icon={TrendingUp}
                label="Build"
                value={filteredStats.build}
                unit="m"
                color="#10b981"
                th={th}
              />
              <StatCard
                icon={Activity}
                label="Stop"
                value={filteredStats.stop}
                unit="m"
                color="#ef4444"
                th={th}
              />
              <StatCard
                icon={Award}
                label="Eff"
                value={`${filteredStats.eff}`}
                unit="%"
                color="#3b82f6"
                th={th}
              />
            </div>

            {/* Main Chart */}
            <div style={{ ...card, marginBottom: "14px" }}>
              <p
                style={{
                  margin: "0 0 18px",
                  fontSize: "0.6rem",
                  color: th.textMuted,
                  letterSpacing: "2px",
                }}
              >
                BUILD vs STOP — {filterLabel.toUpperCase()}
              </p>
              <ResponsiveContainer width="100%" height={290}>
                <ComposedChart
                  data={chartData}
                  margin={{ top: 10, right: 8, bottom: 0, left: -12 }}
                >
                  <CartesianGrid vertical={false} stroke={th.gridLine} />
                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 9,
                      fill: th.textMuted,
                      fontFamily: "Syne",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fontSize: 9,
                      fill: th.textMuted,
                      fontFamily: "Syne",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={ttip}
                    formatter={(v, name) => [
                      `${v}m`,
                      name === "build" ? "Build" : "Stop",
                    ]}
                  />
                  <Bar
                    dataKey="build"
                    name="Build"
                    fill="#10b981"
                    barSize={18}
                    radius={[5, 5, 0, 0]}
                    opacity={0.9}
                  />
                  <Bar
                    dataKey="stop"
                    name="Stop"
                    fill="#ef4444"
                    barSize={18}
                    radius={[5, 5, 0, 0]}
                    opacity={0.9}
                  />
                  {/* Goal reference */}
                  <ReferenceLine
                    y={globalGoal}
                    stroke="#fbbf24"
                    strokeDasharray="6 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Goal ${globalGoal}m`,
                      fill: "#fbbf24",
                      fontSize: 9,
                      position: "insideTopRight",
                      fontFamily: "Syne",
                    }}
                  />
                  {/* Average reference */}
                  {filterAvg !== null && (
                    <ReferenceLine
                      y={filterAvg}
                      stroke="#8b5cf6"
                      strokeDasharray="4 3"
                      strokeWidth={1.5}
                      label={{
                        value: `Avg ${filterAvg}m`,
                        fill: "#8b5cf6",
                        fontSize: 9,
                        position: "insideTopLeft",
                        fontFamily: "Syne",
                      }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
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
                  ["#fbbf24", "Goal"],
                  ["#8b5cf6", "Avg"],
                ].map(([c, l]) => (
                  <div
                    key={l}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "0.68rem",
                      color: th.textMuted,
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

            {/* All-time deep insights */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
              <StatCard
                icon={Flame}
                label="Best Streak"
                value={deepAnalytics.maxStreak}
                unit=" days"
                color="#fbbf24"
                th={th}
              />
              <StatCard
                icon={Calendar}
                label="Consistency"
                value={`${deepAnalytics.consistency}`}
                unit="%"
                color="#3b82f6"
                th={th}
              />
              <StatCard
                icon={Star}
                label="Win Rate"
                value={`${deepAnalytics.winRate}`}
                unit="%"
                color="#10b981"
                th={th}
                delta={deepAnalytics.weekDelta}
              />
            </div>

            {/* Week-over-week comparison */}
            <div style={{ ...card16, marginBottom: "14px" }}>
              <p
                style={{
                  margin: "0 0 14px",
                  fontSize: "0.6rem",
                  color: th.textMuted,
                  letterSpacing: "2px",
                }}
              >
                WEEK-OVER-WEEK BUILD TIME
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                {[
                  {
                    label: "This Week",
                    value: deepAnalytics.thisWeek,
                    color: "#3b82f6",
                  },
                  {
                    label: "Last Week",
                    value: deepAnalytics.lastWeek,
                    color: "#64748b",
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ flex: 1, textAlign: "center" }}>
                    <div
                      style={{
                        fontFamily: "'Space Mono',monospace",
                        fontSize: "1.6rem",
                        fontWeight: "700",
                        color,
                      }}
                    >
                      {value}m
                    </div>
                    <div
                      style={{
                        fontSize: "0.62rem",
                        color: th.textMuted,
                        marginTop: "4px",
                      }}
                    >
                      {label}
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0 8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "0.9rem",
                      fontWeight: "700",
                      color:
                        deepAnalytics.weekDelta >= 0 ? "#10b981" : "#ef4444",
                    }}
                  >
                    {deepAnalytics.weekDelta >= 0 ? (
                      <ArrowUpRight size={18} />
                    ) : (
                      <ArrowDownRight size={18} />
                    )}
                    {Math.abs(deepAnalytics.weekDelta)}%
                  </div>
                </div>
              </div>
              <div style={{ marginTop: "14px", display: "flex", gap: "8px" }}>
                <div
                  style={{
                    flex: deepAnalytics.thisWeek || 1,
                    height: "6px",
                    background: "#3b82f6",
                    borderRadius: "3px",
                    transition: "flex .8s ease",
                  }}
                />
                <div
                  style={{
                    flex: deepAnalytics.lastWeek || 1,
                    height: "6px",
                    background: "#475569",
                    borderRadius: "3px",
                    transition: "flex .8s ease",
                  }}
                />
              </div>
            </div>

            {/* Top habits */}
            <div style={{ ...card, marginBottom: "14px" }}>
              <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "140px" }}>
                  <HabitRank
                    habits={deepAnalytics.topBuild}
                    type="build"
                    th={th}
                  />
                </div>
                <div
                  style={{
                    width: "1px",
                    background: th.cardBorder,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: "140px" }}>
                  <HabitRank
                    habits={deepAnalytics.topStop}
                    type="stop"
                    th={th}
                  />
                </div>
              </div>
            </div>

            {/* Pie */}
            <div style={card}>
              <p
                style={{
                  margin: "0 0 18px",
                  fontSize: "0.6rem",
                  color: th.textMuted,
                  letterSpacing: "2px",
                }}
              >
                SUBJECT COMPOSITION (ALL TIME)
              </p>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={pieSegments}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={78}
                    stroke="none"
                    paddingAngle={4}
                  >
                    {pieSegments.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={ttip} />
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
                      gap: "5px",
                      fontSize: "0.7rem",
                      color: th.textMuted,
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
                    {s.name} <span style={{ opacity: 0.6 }}>({s.value}m)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════ GOALS & SETTINGS ════ */}
        {activeTab === "targets" && (
          <div className="fu">
            {/* ── My Habit Goal ── */}
            <div style={card}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "18px",
                }}
              >
                <Star size={18} color="#fbbf24" />
                <span
                  style={{
                    fontWeight: "700",
                    fontSize: "1.1rem",
                    color: th.text,
                  }}
                >
                  My Habit Goal
                </span>
              </div>

              <label
                style={{
                  fontSize: "0.6rem",
                  color: th.textMuted,
                  letterSpacing: "2px",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                WHAT DO YOU WANT TO ACHIEVE?
              </label>
              <textarea
                placeholder="e.g. Read books instead of scrolling, Run 5km daily, Cut out late-night snacking..."
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                rows={2}
                style={{
                  ...inp,
                  resize: "vertical",
                  lineHeight: 1.5,
                  marginBottom: "12px",
                }}
              />

              <label
                style={{
                  fontSize: "0.6rem",
                  color: th.textMuted,
                  letterSpacing: "2px",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                WHICH SPECIFIC HABIT? (optional)
              </label>
              <input
                placeholder="e.g. Deep Work, Social Media, Exercise..."
                value={goalSubject}
                onChange={(e) => setGoalSubject(e.target.value)}
                style={inp}
              />

              <label
                style={{
                  fontSize: "0.6rem",
                  color: th.textMuted,
                  letterSpacing: "2px",
                  display: "block",
                  marginBottom: "10px",
                }}
              >
                GOAL TYPE
              </label>
              <div
                style={{ display: "flex", gap: "10px", marginBottom: "20px" }}
              >
                {[
                  ["build", "🚀 Build It", "#10b981"],
                  ["stop", "⛔ Stop It", "#ef4444"],
                ].map(([val, label, color]) => (
                  <div
                    key={val}
                    onClick={() => setGoalHabitType(val)}
                    style={{
                      flex: 1,
                      padding: "12px 8px",
                      borderRadius: "12px",
                      cursor: "pointer",
                      background:
                        goalHabitType === val ? `${color}18` : th.selectBg,
                      border: `1px solid ${goalHabitType === val ? color : th.inputBdr}`,
                      textAlign: "center",
                      fontWeight: "700",
                      fontSize: "0.88rem",
                      color: goalHabitType === val ? color : th.textMuted,
                      transition: "all .2s",
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Daily Time Target ── */}
            <div style={{ ...card, marginTop: "14px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "14px",
                }}
              >
                <Target size={18} color="#3b82f6" />
                <span
                  style={{
                    fontWeight: "700",
                    fontSize: "1.1rem",
                    color: th.text,
                  }}
                >
                  Daily Time Target
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: th.textMuted,
                  marginBottom: "18px",
                  lineHeight: 1.65,
                }}
              >
                Controls both ring scales. The outer green ring fills as you
                build. The inner red ring fills as you stop — confronting you
                with wasted time. Analytics average reference also uses this.
              </p>
              <label
                style={{
                  fontSize: "0.6rem",
                  color: th.textMuted,
                  letterSpacing: "2px",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                TARGET (MINUTES PER DAY)
              </label>
              <input
                type="number"
                value={globalGoal}
                style={{
                  ...inp,
                  fontFamily: "'Space Mono',monospace",
                  fontSize: "1.6rem",
                  fontWeight: "700",
                  textAlign: "center",
                  marginBottom: "14px",
                }}
                onChange={(e) => setGlobalGoal(Number(e.target.value))}
              />
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[30, 60, 90, 120, 180, 240, 300, 360].map((v) => (
                  <button
                    key={v}
                    onClick={() => setGlobalGoal(v)}
                    style={{
                      flex: 1,
                      minWidth: "48px",
                      padding: "10px 2px",
                      borderRadius: "10px",
                      background:
                        globalGoal === v ? "rgba(59,130,246,.18)" : th.quickBtn,
                      border: `1px solid ${globalGoal === v ? "rgba(59,130,246,.5)" : "transparent"}`,
                      color: globalGoal === v ? "#3b82f6" : th.textMuted,
                      cursor: "pointer",
                      fontSize: "0.72rem",
                      fontWeight: "700",
                      transition: "all .2s",
                    }}
                  >
                    {v}m
                  </button>
                ))}
              </div>
            </div>

            {/* ── Lambert Shield ── */}
            <div style={{ ...card, marginTop: "14px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ flex: 1, marginRight: "20px" }}>
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
                    <span
                      style={{
                        fontWeight: "700",
                        fontSize: "1.05rem",
                        color: th.text,
                      }}
                    >
                      Lambert Shield
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.8rem",
                      color: th.textMuted,
                      lineHeight: 1.55,
                    }}
                  >
                    Intercepts your #1 disruptor:{" "}
                    <strong style={{ color: "#ef4444" }}>
                      {analytics.disruptor}
                    </strong>
                    . You'll be warned before logging it again.
                  </p>
                </div>
                <Toggle
                  on={shieldActive}
                  onToggle={() => setShieldActive((v) => !v)}
                  activeColor="#ef4444"
                  offColor={th.switchOff}
                />
              </div>
            </div>

            {/* ── Performance Summary ── */}
            <div style={{ ...card, marginTop: "14px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                <BarChart2 size={18} color="#8b5cf6" />
                <span
                  style={{
                    fontWeight: "700",
                    fontSize: "1.05rem",
                    color: th.text,
                  }}
                >
                  Performance Summary
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {[
                  {
                    label: "All-time best streak",
                    value: `${deepAnalytics.maxStreak} days`,
                    color: "#fbbf24",
                  },
                  {
                    label: "Consistency rate",
                    value: `${deepAnalytics.consistency}%`,
                    color: "#3b82f6",
                  },
                  {
                    label: "Daily win rate (build > stop)",
                    value: `${deepAnalytics.winRate}%`,
                    color: "#10b981",
                  },
                  {
                    label: "Avg session length",
                    value: `${deepAnalytics.avgSession} min`,
                    color: "#8b5cf6",
                  },
                  {
                    label: "Best day of the week",
                    value: deepAnalytics.bestDay,
                    color: "#f59e0b",
                  },
                  {
                    label: "This week's build time",
                    value: `${deepAnalytics.thisWeek} min`,
                    color: "#3b82f6",
                  },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 0",
                      borderBottom: `1px solid ${th.cardBorder}`,
                    }}
                  >
                    <span style={{ fontSize: "0.82rem", color: th.textMuted }}>
                      {label}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Space Mono',monospace",
                        fontSize: "0.88rem",
                        fontWeight: "700",
                        color,
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── LOG MODAL ── */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: th.overlayBg,
            WebkitBackdropFilter: "blur(6px)",
            backdropFilter: "blur(6px)",
            zIndex: 3000,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="modal-up"
            style={{
              width: "100%",
              maxWidth: "500px",
              background: th.modalBg,
              borderRadius: "28px 28px 20px 20px",
              padding: "30px 24px 36px",
              border: `1px solid ${th.cardBorder}`,
              boxShadow: "0 -20px 60px rgba(0,0,0,.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
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
                    fontSize: "1.22rem",
                    color: th.text,
                  }}
                >
                  Log Habit
                </h2>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "0.7rem",
                    color: th.textMuted,
                  }}
                >
                  Build momentum or log a disruptor
                </p>
              </div>
              <div
                onClick={() => setIsModalOpen(false)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: th.inputBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={15} color={th.text} />
              </div>
            </div>

            {analytics.isThreat && (
              <div
                style={{
                  background: "rgba(239,68,68,.09)",
                  border: "1px solid rgba(239,68,68,.3)",
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
                <Shield size={13} /> ⚠ Lambert Shield: "{analytics.disruptor}"
                is your top disruptor.
              </div>
            )}

            <label
              style={{
                fontSize: "0.6rem",
                color: th.textMuted,
                letterSpacing: "2px",
                display: "block",
                marginBottom: "6px",
              }}
            >
              SUBJECT
            </label>
            <input
              placeholder="e.g. Deep Work, Social Media..."
              style={inp}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              autoFocus
            />

            <label
              style={{
                fontSize: "0.6rem",
                color: th.textMuted,
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
              style={inp}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />

            <label
              style={{
                fontSize: "0.6rem",
                color: th.textMuted,
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
                    background: habitType === val ? `${color}18` : th.selectBg,
                    border: `1px solid ${habitType === val ? color : th.inputBdr}`,
                    textAlign: "center",
                    fontWeight: "700",
                    fontSize: "0.88rem",
                    color: habitType === val ? color : th.textMuted,
                    transition: "all .2s",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            <button
              onClick={handleLogHabit}
              disabled={isLogging || !subject || !duration}
              style={{
                background:
                  !subject || !duration
                    ? th.inputBg
                    : "linear-gradient(135deg,#3b82f6,#1d4ed8)",
                color: !subject || !duration ? th.textMuted : "#fff",
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
                letterSpacing: "0.5px",
                boxShadow:
                  subject && duration
                    ? "0 4px 28px rgba(59,130,246,.25)"
                    : "none",
                transition: "all .25s",
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
