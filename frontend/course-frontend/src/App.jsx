import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const filters = ["All tasks", "Today", "Upcoming", "Completed"];

function Icon({ name, size = 18 }) {
  const paths = {
    check: <path d="m5 12 4 4L19 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
    calendar: <><rect x="3" y="4.5" width="18" height="17" rx="2" /><path d="M16 2v5M8 2v5M3 10h18" /></>,
    spark: <><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z" /><path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" /></>,
    inbox: <><path d="M4 5.5h16v13H4z" /><path d="M4 14h4l1.5 2h5L16 14h4" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v5M14 11v5" /></>,
    chevron: <path d="m9 6 6 6-6 6" />,
    logout: <><path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-5" /></>,
  };
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.method && options.method !== "GET" ? { "X-Requested-With": "XMLHttpRequest" } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try { message = (await response.json()).error || message; } catch { /* non-JSON response */ }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return null;
  return response.json();
}

function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await request(`/${mode}`, { method: "POST", body: JSON.stringify(form) });
      const user = await request("/me");
      onAuthenticated(user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return <main className="auth-page"><div className="auth-card"><div className="brand auth-brand"><span className="brand-mark"><Icon name="check" size={20} /></span><span>grux<span className="brand-dot">.</span></span></div><p className="auth-kicker">PERSONAL TASKS, YOUR WAY</p><h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1><p className="auth-copy">{mode === "login" ? "Sign in to pick up where you left off." : "Start organizing your work in one calm place."}</p><form onSubmit={submit}>{mode === "register" && <label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Monica Chen" /></label>}<label>Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label><label>Password<input required minLength="8" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button auth-submit" disabled={loading}>{loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}</button></form><button className="auth-switch" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "Need an account? Create one" : "Already have an account? Sign in"}</button></div></main>;
}

function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All tasks");
  const [newTask, setNewTask] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSession = async () => {
      try {
        const currentUser = await request("/me");
        const result = await request("/api/tasks");
        setUser(currentUser);
        setTasks(result.data || []);
      } catch (requestError) {
        if (requestError.status !== 401) setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(query.toLowerCase());
    const dueToday = task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString();
    if (activeFilter === "Completed") return matchesSearch && task.status === "done";
    if (activeFilter === "Today") return matchesSearch && dueToday && task.status !== "done";
    if (activeFilter === "Upcoming") return matchesSearch && !dueToday && task.status !== "done";
    return matchesSearch;
  }), [activeFilter, query, tasks]);

  const completed = tasks.filter((task) => task.status === "done").length;
  const addTask = async (event) => {
    event.preventDefault();
    if (!newTask.trim()) return;
    try {
      const result = await request("/api/tasks", { method: "POST", body: JSON.stringify({ title: newTask.trim(), priority: "medium" }) });
      setTasks((currentTasks) => [result.data, ...currentTasks]);
      setNewTask("");
      setError("");
    } catch (requestError) { setError(requestError.message); }
  };
  const toggleTask = async (task) => {
    const status = task.status === "done" ? "todo" : "done";
    try {
      const result = await request(`/api/tasks/${task._id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setTasks((currentTasks) => currentTasks.map((item) => item._id === task._id ? result.data : item));
    } catch (requestError) { setError(requestError.message); }
  };
  const deleteTask = async (id) => {
    try {
      await request(`/api/tasks/${id}`, { method: "DELETE" });
      setTasks((currentTasks) => currentTasks.filter((task) => task._id !== id));
    } catch (requestError) { setError(requestError.message); }
  };
  const logout = async () => {
    try { await request("/logout", { method: "POST" }); setUser(null); setTasks([]); } catch (requestError) { setError(requestError.message); }
  };

  if (loading) return <div className="loading-screen"><span className="brand-mark"><Icon name="check" size={20} /></span><p>Loading your workspace...</p></div>;
  if (!user) return <AuthForm onAuthenticated={(authenticatedUser) => { setUser(authenticatedUser); request("/api/tasks").then((result) => setTasks(result.data || [])).catch((requestError) => setError(requestError.message)); }} />;

  const firstName = user.name.split(" ")[0];
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark"><Icon name="check" size={20} /></span><span>grux<span className="brand-dot">.</span></span></div><div className="workspace-switcher"><span className="workspace-avatar">{firstName[0]}</span><span>{firstName}&apos;s workspace</span><Icon name="chevron" size={14} /></div><nav className="sidebar-nav"><p className="nav-label">Workspace</p><button className="nav-item active"><Icon name="inbox" /> <span>Tasks</span><span className="nav-count">{tasks.length}</span></button><button className="nav-item"><Icon name="calendar" /> <span>Calendar</span></button><button className="nav-item"><Icon name="spark" /> <span>Insights</span></button><p className="nav-label projects-label">Projects</p>{["Product", "Marketing", "Growth"].map((project) => <button className="nav-item project-item" key={project}><span className={`project-dot ${project.toLowerCase()}`} />{project}</button>)}</nav><div className="sidebar-footer"><div className="user-avatar">{user.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div><div><strong>{user.name}</strong><span>{user.email}</span></div><button className="more-button" onClick={logout} aria-label="Log out"><Icon name="logout" size={16} /></button></div></aside>
    <main className="main-content"><header className="topbar"><div className="breadcrumb"><span>{firstName}&apos;s workspace</span><Icon name="chevron" size={14} /><strong>Tasks</strong></div><div className="topbar-actions"><label className="search"><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks..." /></label><button className="date-button"><Icon name="calendar" size={16} /> {new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })}</button></div></header>
      {error && <div className="api-error">{error}<button onClick={() => setError("")}>Dismiss</button></div>}<section className="page-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}</p><h1>Good morning, {firstName} <span className="wave">✦</span></h1><p className="heading-subtitle">A clear mind starts with a clear plan.</p></div><button className="primary-button" onClick={() => document.querySelector(".task-input")?.focus()}><Icon name="plus" size={18} /> Add task</button></section>
      <section className="overview-grid"><div className="overview-card progress-card"><div className="card-title">Today&apos;s progress <span className="progress-percent">{tasks.length ? Math.round((completed / tasks.length) * 100) : 0}%</span></div><div className="progress-track"><span style={{ width: `${tasks.length ? (completed / tasks.length) * 100 : 0}%` }} /></div><p>{completed} of {tasks.length} tasks completed</p></div><div className="overview-card"><span className="stat-icon orange"><Icon name="clock" /></span><div><strong>{tasks.filter((task) => task.status !== "done").length}</strong><p>Open tasks</p></div></div><div className="overview-card"><span className="stat-icon purple"><Icon name="spark" /></span><div><strong>{tasks.filter((task) => task.priority === "high" && task.status !== "done").length}</strong><p>High priority</p></div></div></section>
      <section className="task-section"><div className="section-heading"><div><h2>Your tasks</h2><p>Stay focused on what matters most.</p></div><button className="view-button">Board view <Icon name="chevron" size={14} /></button></div><div className="filter-row">{filters.map((filter) => <button key={filter} className={`filter-button ${activeFilter === filter ? "selected" : ""}`} onClick={() => setActiveFilter(filter)}>{filter}{filter === "All tasks" && <span>{tasks.length}</span>}</button>)}</div><form className="quick-add" onSubmit={addTask}><span className="quick-add-icon"><Icon name="plus" size={17} /></span><input className="task-input" value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="Add a new task..." /><button type="submit">Add task <span>↵</span></button></form><div className="task-list">{visibleTasks.map((task) => <article className={`task-row ${task.status === "done" ? "is-done" : ""}`} key={task._id}><button className={`task-check ${task.status === "done" ? "checked" : ""}`} onClick={() => toggleTask(task)} aria-label={`Mark ${task.title} as ${task.status === "done" ? "incomplete" : "complete"}`}>{task.status === "done" && <Icon name="check" size={14} />}</button><div className="task-info"><h3>{task.title}</h3><div className="task-meta"><span className="project-pill">{task.description || "Inbox"}</span><span><Icon name="calendar" size={13} /> {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "No date"}</span><span className={`priority ${task.priority}`}><i /> {task.priority}</span></div></div><button className="delete-task" onClick={() => deleteTask(task._id)} aria-label={`Delete ${task.title}`}><Icon name="trash" size={16} /></button></article>)}{visibleTasks.length === 0 && <div className="empty-state"><span>✦</span><h3>No tasks here</h3><p>Try another filter or add something new.</p></div>}</div></section></main>
  </div>;
}

export default App;
