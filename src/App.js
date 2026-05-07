import React, { useState, useMemo, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Line,
} from "recharts";
import {
  Menu,
  X,
  Zap,
  BarChart2,
  Moon,
  Sun,
  Home,
  LogOut,
  Target,
  Trash2,
  BookOpen,
  Activity,
  CheckCircle,
  Clock,
} from "lucide-react";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const App = () => {
  const [session, setSession] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMenuSection, setActiveMenuSection] = useState("home");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // --- FULL STATE SUITE (NO MISSING DATA) ---
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState("");
  const [habitType, setHabitType] = useState("continue");
  const [newTargetSubject, setNewTargetSubject] = useState("");
  const [newTargetMin, setNewTargetMin] = useState("");

  const [tasks, setTasks] = useState([]);
  const [targets, setTargets] = useState([]);

  const [timeFilter, setTimeFilter] = useState("daily");
  const [sortFilter, setSortFilter] = useState("latest");

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  useEffect(() => {
    if (session) {
      fetchLogs();
      fetchTargets();
    }
  }, [session]);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("habit_logs")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setTasks(data);
  };

  const fetchTargets = async () => {
    const { data } = await supabase.from("performance_targets").select("*");
    if (data) setTargets(data);
  };

  // --- ANALYTICS LOGIC ---
  // --- AI INTEGRATION LOGIC ---
  // 1. Add this new state variable at the top with your others
  const [shieldActive, setShieldActive] = useState(false);

  // 2. Update your briefingData to handle the alert logic
  const briefingData = useMemo(() => {
    const buildTime = tasks
      .filter((t) => t.habit_type === "continue")
      .reduce((s, t) => s + t.duration, 0);
    const stopTime = tasks
      .filter((t) => t.habit_type === "stop")
      .reduce((s, t) => s + t.duration, 0);
    const total = buildTime + stopTime;
    const efficiency =
      total === 0
        ? 0
        : Math.max(0, Math.round(((buildTime - stopTime) / total) * 100));

    const disruptors = tasks.filter((t) => t.habit_type === "stop");
    const primaryDisruptor =
      disruptors.sort((a, b) => b.duration - a.duration)[0]?.subject || "none";

    // Check if current input matches a known disruptor
    const isThreatDetected =
      shieldActive &&
      habitType === "stop" &&
      subject.toLowerCase().includes(primaryDisruptor.toLowerCase()) &&
      subject !== "";

    let message = "";
    if (isThreatDetected) {
      message = `SHIELD ACTIVE: Entry matches primary disruptor "${primaryDisruptor}". Proceed?`;
    } else if (efficiency >= 85) {
      message = `Efficiency: ${efficiency}%. Strategic core is stable.`;
    } else {
      message = `Efficiency: ${efficiency}%. Variance detected in ${primaryDisruptor}.`;
    }

    return { efficiency, message, isThreatDetected };
  }, [tasks, subject, habitType, shieldActive]);

  const pieSegments = useMemo(() => {
    const COLORS = [
      "#10b981",
      "#3b82f6",
      "#8b5cf6",
      "#f59e0b",
      "#06b6d4",
      "#ec4899",
    ];
    return tasks.slice(0, 10).map((t, i) => ({
      name: t.subject,
      value: t.duration,
      color: t.habit_type === "stop" ? "#ef4444" : COLORS[i % COLORS.length],
    }));
  }, [tasks]);

  const processedData = useMemo(() => {
    let filtered = [...tasks];
    const now = new Date();
    filtered = filtered.filter((item) => {
      const d = new Date(item.created_at);
      if (timeFilter === "daily")
        return d.toDateString() === now.toDateString();
      if (timeFilter === "weekly")
        return (now - d) / (1000 * 60 * 60 * 24) <= 7;
      return true;
    });
    if (sortFilter === "latest")
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (sortFilter === "longest")
      filtered.sort((a, b) => b.duration - a.duration);
    return filtered;
  }, [tasks, timeFilter, sortFilter]);

  const globalGoal = useMemo(() => {
    if (targets.length === 0) return 60;
    return Math.round(targets.reduce((s, t) => s + t.weekly_goal_min, 0) / 7);
  }, [targets]);

  const theme = {
    bg: isDarkMode ? "#020617" : "#f8fafc",
    card: isDarkMode ? "#1e293b" : "#ffffff",
    text: isDarkMode ? "#f8fafc" : "#1e293b",
    input: isDarkMode ? "#0f172a" : "#f1f5f9",
    border: isDarkMode ? "#334155" : "#e2e8f0",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: theme.bg,
        color: theme.text,
        transition: "0.3s",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ maxWidth: "850px", margin: "0 auto", padding: "0 20px" }}>
        {/* HEADER */}
        <header
          style={{
            padding: "30px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Menu
            onClick={() => setIsMenuOpen(true)}
            style={{ cursor: "pointer" }}
          />
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontWeight: "900",
                letterSpacing: "3px",
                fontSize: "0.9rem",
              }}
            >
              LAMBERT
            </div>
            <div style={{ fontSize: "0.65rem", opacity: 0.5 }}>
              Efficiency Engine
            </div>
          </div>
          <LogOut
            size={18}
            onClick={() => supabase.auth.signOut()}
            style={{ cursor: "pointer" }}
          />
        </header>

        {/* NAVIGATION SIDEBAR */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: isMenuOpen ? 0 : "-100%",
            width: "260px",
            height: "100%",
            background: theme.card,
            zIndex: 9999,
            transition: "0.4s",
            padding: "40px",
            borderRight: `1px solid ${theme.border}`,
          }}
        >
          <X
            onClick={() => setIsMenuOpen(false)}
            style={{ cursor: "pointer", marginBottom: "40px" }}
          />
          <div
            onClick={() => {
              setActiveMenuSection("home");
              setIsMenuOpen(false);
            }}
            style={navItem}
          >
            <Home size={18} /> Home
          </div>
          <div
            onClick={() => {
              setActiveMenuSection("analytics");
              setIsMenuOpen(false);
            }}
            style={navItem}
          >
            <BarChart2 size={18} /> Analytics Hub
          </div>
          <div
            onClick={() => {
              setActiveMenuSection("targets");
              setIsMenuOpen(false);
            }}
            style={navItem}
          >
            <Target size={18} /> Targets
          </div>
          <div onClick={() => setIsDarkMode(!isDarkMode)} style={navItem}>
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}{" "}
            {isDarkMode ? "Light" : "Dark"} Mode
          </div>
        </div>

        {/* HOME SECTION */}
        {activeMenuSection === "home" && (
          <main>
            <div style={aiBriefStyle}>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.6rem",
                  fontWeight: "900",
                  color: "#fbbf24",
                }}
              >
                <Zap
                  size={10}
                  style={{ display: "inline", marginRight: "5px" }}
                />{" "}
                ERIC'S STRATEGIC BRIEFING
              </p>
              <p style={{ margin: "8px 0 0 0", fontWeight: "600" }}>
                "{briefingData.message}"
              </p>
            </div>

            <div
              style={{
                background: theme.card,
                borderRadius: "32px",
                padding: "40px",
                textAlign: "center",
                border: `1px solid ${theme.border}`,
                position: "relative",
                marginBottom: "25px",
              }}
            >
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieSegments.length > 0 ? pieSegments : [{ value: 1 }]}
                    dataKey="value"
                    innerRadius={85}
                    outerRadius={105}
                    stroke="none"
                    paddingAngle={5}
                  >
                    {pieSegments.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      background: "#0f172a",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: "absolute",
                  top: "45%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "none",
                }}
              >
                <div style={{ fontSize: "3.5rem", fontWeight: "900" }}>
                  {briefingData.efficiency}%
                </div>
              </div>
              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  opacity: 0.7,
                }}
              >
                <BookOpen size={14} color="#10b981" />
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "800",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  Mastery of habits to cultivate
                </span>
              </div>
            </div>
            <button onClick={() => setIsModalOpen(true)} style={actionBtn}>
              + Log New Habit
            </button>
          </main>
        )}

        {/* ANALYTICS SECTION */}
        {activeMenuSection === "analytics" && (
          <div style={{ paddingBottom: "50px" }}>
            <h2>Analytics Hub</h2>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <select
                style={selectStyle(theme)}
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
              >
                <option value="daily">Daily View</option>
                <option value="weekly">Weekly View</option>
              </select>
              <select
                style={selectStyle(theme)}
                value={sortFilter}
                onChange={(e) => setSortFilter(e.target.value)}
              >
                <option value="latest">Latest First</option>
                <option value="longest">Longest Duration</option>
              </select>
            </div>

            <div
              style={{
                background: theme.card,
                padding: "25px",
                borderRadius: "24px",
                marginBottom: "30px",
                border: `1px solid ${theme.border}`,
              }}
            >
              <p
                style={{
                  fontSize: "0.65rem",
                  fontWeight: "800",
                  opacity: 0.4,
                  marginBottom: "15px",
                }}
              >
                MOMENTUM SLOPE
              </p>
              {/* CORRECTED CHART LOGIC */}
              <div style={{ height: "220px" }}>
                <ResponsiveContainer>
                  <ComposedChart
                    data={[...processedData].reverse()}
                    margin={{ left: -30 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis hide />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "none",
                        borderRadius: "10px",
                      }}
                      itemStyle={{ fontWeight: "bold" }}
                    />
                    <Bar dataKey="duration" radius={[4, 4, 0, 0]} barSize={20}>
                      {/* THE FIX: Map colors strictly based on habit_type from the processed data */}
                      {[...processedData].reverse().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.habit_type === "continue"
                              ? "#10b981"
                              : "#ef4444"
                          }
                        />
                      ))}
                    </Bar>
                    <Line
                      type="monotone"
                      dataKey="duration"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2 }}
                    />
                    <ReferenceLine
                      y={globalGoal}
                      stroke="#fbbf24"
                      strokeDasharray="5 5"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* FULL ACTIVITY LOG LIST */}
            <p
              style={{
                fontSize: "0.6rem",
                fontWeight: "900",
                opacity: 0.4,
                letterSpacing: "2px",
                marginBottom: "15px",
              }}
            >
              ACTIVITY LOG
            </p>
            {processedData.length > 0 ? (
              processedData.map((t) => (
                <div key={t.id} style={listItem(theme)}>
                  <div>
                    <div
                      style={{
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {t.habit_type === "continue" ? (
                        <CheckCircle size={12} color="#10b981" />
                      ) : (
                        <Activity size={12} color="#ef4444" />
                      )}
                      {t.subject}
                    </div>
                    <div style={{ fontSize: "0.6rem", opacity: 0.4 }}>
                      {new Date(t.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: "900",
                        color:
                          t.habit_type === "continue" ? "#10b981" : "#ef4444",
                      }}
                    >
                      {t.duration}m
                    </span>
                    <Trash2
                      size={14}
                      onClick={async () => {
                        if (window.confirm("Delete log?")) {
                          await supabase
                            .from("habit_logs")
                            .delete()
                            .eq("id", t.id);
                          fetchLogs();
                        }
                      }}
                      style={{ cursor: "pointer", opacity: 0.3 }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{ textAlign: "center", opacity: 0.3, padding: "40px" }}
              >
                No logs for this period.
              </div>
            )}
          </div>
        )}

        {/* TARGETS SECTION */}
        {activeMenuSection === "targets" && (
          <div>
            <h2>Manage Targets</h2>
            <div
              style={{
                background: theme.card,
                padding: "25px",
                borderRadius: "24px",
                border: `1px solid ${theme.border}`,
                marginBottom: "20px",
              }}
            >
              <input
                style={inputStyle(theme)}
                placeholder="Habit Name (e.g. Reading)"
                value={newTargetSubject}
                onChange={(e) => setNewTargetSubject(e.target.value)}
              />
              <input
                style={inputStyle(theme)}
                type="number"
                placeholder="Weekly Goal (minutes)"
                value={newTargetMin}
                onChange={(e) => setNewTargetMin(e.target.value)}
              />
              <button
                onClick={async () => {
                  if (!newTargetSubject || !newTargetMin) return;
                  await supabase.from("performance_targets").insert([
                    {
                      subject: newTargetSubject,
                      weekly_goal_min: parseInt(newTargetMin),
                      user_id: session.user.id,
                    },
                  ]);
                  fetchTargets();
                  setNewTargetSubject("");
                  setNewTargetMin("");
                }}
                style={actionBtn}
              >
                Save Strategy
              </button>
            </div>
            {targets.map((t) => (
              <div key={t.id} style={listItem(theme)}>
                <div>
                  <span style={{ fontWeight: "800" }}>{t.subject}</span>
                  <span
                    style={{
                      marginLeft: "10px",
                      color: "#3b82f6",
                      fontSize: "0.8rem",
                    }}
                  >
                    {t.weekly_goal_min}m/week
                  </span>
                </div>
                <Trash2
                  size={16}
                  onClick={async () => {
                    await supabase
                      .from("performance_targets")
                      .delete()
                      .eq("id", t.id);
                    fetchTargets();
                  }}
                  style={{ cursor: "pointer", opacity: 0.3 }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div style={modalOverlay}>
          <div
            style={{
              background: theme.card,
              width: "90%",
              maxWidth: "400px",
              borderRadius: "32px",
              padding: "35px",
              border: `1px solid ${theme.border}`,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Log Habit</h3>
            <input
              style={inputStyle(theme)}
              placeholder="What did you do?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <input
              style={inputStyle(theme)}
              type="number"
              placeholder="Minutes"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
            <select
              style={inputStyle(theme)}
              value={habitType}
              onChange={(e) => setHabitType(e.target.value)}
            >
              <option value="continue">Cultivate (Productive)</option>
              <option value="stop">Counter-Productive</option>
            </select>
            <button
              onClick={async () => {
                const cleanSubject = subject.replace(/[<>]/g, "");
                if (!cleanSubject || !duration) return;
                await supabase.from("habit_logs").insert([
                  {
                    subject,
                    cleanSubject,
                    duration: parseInt(duration),
                    habit_type: habitType,
                    user_id: session.user.id,
                  },
                ]);
                fetchLogs();
                setIsModalOpen(false);
                setSubject("");
                setDuration("");
              }}
              style={actionBtn}
            >
              Sync to Hub
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                color: "#64748b",
                marginTop: "15px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const navItem = {
  display: "flex",
  alignItems: "center",
  gap: "15px",
  padding: "18px 0",
  cursor: "pointer",
  fontWeight: "700",
};
const actionBtn = {
  width: "100%",
  padding: "18px",
  borderRadius: "16px",
  border: "none",
  background: "#3b82f6",
  color: "white",
  fontWeight: "900",
  cursor: "pointer",
};
const aiBriefStyle = {
  background: "rgba(59, 130, 246, 0.08)",
  border: "1px solid rgba(59, 130, 246, 0.2)",
  borderRadius: "24px",
  padding: "24px",
  marginBottom: "20px",
};
const inputStyle = (t) => ({
  background: t.input,
  border: "none",
  borderRadius: "14px",
  padding: "18px",
  color: t.text,
  width: "100%",
  marginBottom: "12px",
  outline: "none",
});
const selectStyle = (t) => ({
  background: t.input,
  border: `1px solid ${t.border}`,
  borderRadius: "12px",
  padding: "10px",
  color: t.text,
  outline: "none",
});
const listItem = (t) => ({
  background: t.card,
  borderRadius: "16px",
  padding: "18px",
  marginBottom: "10px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  border: `1px solid ${t.border}`,
});
const modalOverlay = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.85)",
  zIndex: 10000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export default App;
