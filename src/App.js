import React, { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Line,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import {
  Menu,
  X,
  Zap,
  BarChart2,
  Moon,
  Sun,
  Home,
  ChevronLeft,
  Activity,
  ArrowUpDown,
  Calendar,
  Layout,
} from "lucide-react";

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMenuSection, setActiveMenuSection] = useState("home");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // States
  const [timeFrame, setTimeFrame] = useState("daily");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortType, setSortType] = useState("date");

  const [tasks, setTasks] = useState([]);
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState("");
  const [habitType, setHabitType] = useState("continue");

  const name = "Lambert";

  const addTask = () => {
    if (!subject.trim() || !duration) return;
    setTasks([
      {
        id: Date.now(),
        subject: subject.trim(),
        duration: parseInt(duration),
        habitType,
        timestamp: new Date(),
      },
      ...tasks,
    ]);
    setSubject("");
    setDuration("");
    setIsModalOpen(false);
  };

  // 1. Data Filtering Logic
  const filteredData = useMemo(() => {
    const now = new Date();
    let data = tasks.filter((t) => {
      const tDate = new Date(t.timestamp);
      if (timeFrame === "daily")
        return tDate.toDateString() === now.toDateString();
      if (timeFrame === "weekly")
        return (now - tDate) / (1000 * 60 * 60 * 24) <= 7;
      if (timeFrame === "monthly") return tDate.getMonth() === now.getMonth();
      return true;
    });
    if (categoryFilter !== "all")
      data = data.filter((t) => t.habitType === categoryFilter);
    return sortType === "duration"
      ? [...data].sort((a, b) => b.duration - a.duration)
      : [...data].sort((a, b) => b.timestamp - a.timestamp);
  }, [tasks, timeFrame, categoryFilter, sortType]);

  // 2. Tokenomics Segmented Pie Logic
  const segmentedData = useMemo(() => {
    const groups = filteredData.reduce((acc, task) => {
      const key = task.subject.toLowerCase();
      if (!acc[key])
        acc[key] = { name: task.subject, value: 0, type: task.habitType };
      acc[key].value += task.duration;
      return acc;
    }, {});
    const COLORS = [
      "#3b82f6",
      "#10b981",
      "#8b5cf6",
      "#f59e0b",
      "#06b6d4",
      "#ec4899",
      "#f97316",
    ];
    return Object.values(groups).map((item, i) => ({
      ...item,
      color: item.type === "stop" ? "#ef4444" : COLORS[i % COLORS.length],
    }));
  }, [filteredData]);

  const masteryPercent = useMemo(() => {
    const build = tasks
      .filter((t) => t.habitType === "continue")
      .reduce((s, t) => s + t.duration, 0);
    const stop = tasks
      .filter((t) => t.habitType === "stop")
      .reduce((s, t) => s + t.duration, 0);
    const total = build + stop;
    return total === 0
      ? 0
      : Math.max(0, Math.round(((build - stop) / total) * 100));
  }, [tasks]);

  const theme = {
    bg: isDarkMode ? "#020617" : "#f8fafc",
    card: isDarkMode ? "#1e293b" : "#ffffff",
    text: isDarkMode ? "#f8fafc" : "#1e293b",
    subText: isDarkMode ? "#94a3b8" : "#64748b",
    input: isDarkMode ? "#0f172a" : "#f1f5f9",
    border: isDarkMode ? "#334155" : "#e2e8f0",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: theme.bg,
        color: theme.text,
        transition: "0.2s",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: "1000px", padding: "0 15px" }}>
        {/* HEADER */}
        <header
          style={{
            padding: "20px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Menu
            onClick={() => setIsMenuOpen(true)}
            style={{ cursor: "pointer" }}
          />
          <div style={{ fontWeight: "900", letterSpacing: "1px" }}>
            {name.toUpperCase()}
          </div>
          <Zap size={20} color="#fbbf24" fill="#fbbf24" />
        </header>

        {/* SIDEBAR / ANALYTICS DRAWER */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: isMenuOpen ? 0 : "-100%",
            width: "100%",
            maxWidth: "500px",
            height: "100%",
            background: theme.card,
            zIndex: 5000,
            transition: "0.4s",
            padding: "25px",
            boxShadow: "20px 0 60px rgba(0,0,0,0.5)",
            display: isMenuOpen ? "block" : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "30px",
            }}
          >
            {activeMenuSection === "analytics" ? (
              <ChevronLeft onClick={() => setActiveMenuSection("home")} />
            ) : (
              <div />
            )}
            <X
              onClick={() => setIsMenuOpen(false)}
              style={{ cursor: "pointer" }}
            />
          </div>

          {activeMenuSection === "home" ? (
            <nav>
              <div onClick={() => setIsMenuOpen(false)} style={navStyle(theme)}>
                <Home size={20} /> Dashboard Home
              </div>
              <div
                onClick={() => setActiveMenuSection("analytics")}
                style={navStyle(theme)}
              >
                <BarChart2 size={20} /> Precision Analytics
              </div>
              <div
                onClick={() => setIsDarkMode(!isDarkMode)}
                style={navStyle(theme)}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />} Appearance
              </div>
            </nav>
          ) : (
            <div
              style={{ overflowY: "auto", height: "85vh", paddingRight: "5px" }}
            >
              <h2 style={{ margin: "0 0 20px 0" }}>Analytics Hub</h2>

              {/* Time Filters */}
              <div
                style={{ display: "flex", gap: "8px", marginBottom: "20px" }}
              >
                {["daily", "weekly", "monthly", "yearly"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setTimeFrame(f)}
                    style={filterBtn(timeFrame === f, theme)}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* 1. ANALYTICS PIE (TOKENOMICS) */}
              <div
                style={{
                  ...card(theme),
                  marginBottom: "20px",
                  padding: "20px",
                }}
              >
                <p style={labelStyle}>SEGMENTED ALLOCATION</p>
                <div style={{ height: "180px" }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={
                          segmentedData.length > 0
                            ? segmentedData
                            : [{ value: 1 }]
                        }
                        dataKey="value"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        stroke="none"
                      >
                        {segmentedData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        trigger="click"
                        contentStyle={{
                          borderRadius: "12px",
                          background: "#000",
                          border: "none",
                          color: "#fff",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2. ANALYTICS SLOPE (RESTORED HERE TOO) */}
              <div
                style={{
                  ...card(theme),
                  marginBottom: "20px",
                  padding: "20px",
                }}
              >
                <p style={labelStyle}>MOMENTUM SLOPE</p>
                <div style={{ height: "140px" }}>
                  <ResponsiveContainer>
                    <ComposedChart data={[...filteredData].reverse()}>
                      <Bar
                        dataKey="duration"
                        radius={[4, 4, 0, 0]}
                        barSize={12}
                      >
                        {filteredData
                          .slice()
                          .reverse()
                          .map((entry, i) => (
                            <Cell
                              key={i}
                              fill={
                                entry.habitType === "continue"
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
                        strokeWidth={3}
                        dot={{ r: 3 }}
                      />
                      <Tooltip
                        trigger="click"
                        cursor={{ fill: "transparent" }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sort Controls */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                  padding: "10px 0",
                  borderTop: `1px solid ${theme.border}`,
                }}
              >
                <div style={{ display: "flex", gap: "5px" }}>
                  {["all", "stop", "continue"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategoryFilter(c)}
                      style={miniBtn(categoryFilter === c, theme)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div
                  onClick={() =>
                    setSortType(sortType === "date" ? "duration" : "date")
                  }
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    color: "#3b82f6",
                    fontWeight: "bold",
                    fontSize: "0.7rem",
                  }}
                >
                  {sortType === "date" ? (
                    <Calendar size={14} />
                  ) : (
                    <ArrowUpDown size={14} />
                  )}
                  {sortType === "date" ? "DATE" : "TIME"}
                </div>
              </div>

              {filteredData.map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: theme.input,
                    borderRadius: "14px",
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "15px",
                    marginBottom: "8px",
                  }}
                >
                  <div style={{ fontWeight: "600" }}>{t.subject}</div>
                  <div
                    style={{
                      color: t.habitType === "continue" ? "#10b981" : "#ef4444",
                      fontWeight: "900",
                    }}
                  >
                    {t.duration}m
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MAIN DASHBOARD */}
        <main>
          <div
            style={{
              background: theme.card,
              borderRadius: "32px",
              padding: "40px",
              marginBottom: "20px",
              textAlign: "center",
              border: `1px solid ${theme.border}`,
            }}
          >
            <p style={labelStyle}>MASTERY OVERVIEW</p>
            <div style={{ height: "240px", position: "relative" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      segmentedData.length > 0 ? segmentedData : [{ value: 1 }]
                    }
                    dataKey="value"
                    innerRadius={85}
                    outerRadius={105}
                    stroke="none"
                    paddingAngle={4}
                  >
                    {segmentedData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip trigger="click" />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div style={{ fontSize: "3.5rem", fontWeight: "950" }}>
                  {masteryPercent}%
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: theme.card,
              borderRadius: "32px",
              padding: "30px",
              border: `1px solid ${theme.border}`,
            }}
          >
            <p style={labelStyle}>MOMENTUM SLOPE</p>
            <div style={{ height: "160px" }}>
              <ResponsiveContainer>
                <ComposedChart data={[...filteredData].slice(0, 15).reverse()}>
                  <Bar dataKey="duration" radius={[5, 5, 0, 0]} barSize={15}>
                    {filteredData
                      .slice(0, 15)
                      .reverse()
                      .map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            entry.habitType === "continue"
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
                    strokeWidth={4}
                    dot={{ r: 4 }}
                  />
                  <Tooltip trigger="click" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <button onClick={() => setIsModalOpen(true)} style={actionBtn}>
            + Log New Habit
          </button>
        </main>

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
              }}
            >
              <h3 style={{ marginTop: 0 }}>Log Data</h3>
              <input
                style={inputStyle(theme)}
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <input
                style={inputStyle(theme)}
                type="number"
                placeholder="Duration (min)"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
              <select
                style={inputStyle(theme)}
                value={habitType}
                onChange={(e) => setHabitType(e.target.value)}
              >
                <option value="continue">Build Habit</option>
                <option value="stop">Stop Habit</option>
              </select>
              <button onClick={addTask} style={saveBtn}>
                Confirm Entry
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  color: theme.subText,
                  marginTop: "10px",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Styles
const navStyle = (t) => ({
  display: "flex",
  alignItems: "center",
  gap: "15px",
  padding: "20px 0",
  cursor: "pointer",
  borderBottom: `1px solid ${t.border}`,
  fontWeight: "600",
});
const card = (t) => ({ background: t.input, borderRadius: "20px" });
const labelStyle = {
  fontSize: "0.65rem",
  fontWeight: "900",
  opacity: 0.5,
  letterSpacing: "1.5px",
  marginBottom: "10px",
};
const filterBtn = (active, t) => ({
  flex: 1,
  padding: "10px",
  border: "none",
  borderRadius: "10px",
  fontSize: "0.6rem",
  fontWeight: "bold",
  background: active ? "#3b82f6" : t.input,
  color: active ? "white" : t.text,
});
const miniBtn = (active, t) => ({
  padding: "6px 12px",
  border: "none",
  borderRadius: "20px",
  fontSize: "0.65rem",
  fontWeight: "bold",
  background: active ? "#3b82f6" : t.input,
  color: active ? "white" : t.text,
});
const actionBtn = {
  width: "100%",
  marginTop: "30px",
  padding: "22px",
  borderRadius: "22px",
  border: "none",
  background: "#3b82f6",
  color: "white",
  fontWeight: "900",
};
const modalOverlay = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.85)",
  zIndex: 6000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
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
const saveBtn = {
  width: "100%",
  padding: "18px",
  background: "#3b82f6",
  border: "none",
  borderRadius: "16px",
  color: "white",
  fontWeight: "bold",
};

export default App;
