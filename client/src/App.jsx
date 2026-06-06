import { useEffect, useMemo, useState } from "react";
import { createRecommendation, fetchRecommendations, fetchStats, login, logout as apiLogout, updatePriority } from "./api";
import { AppLayout, roleViews } from "./components/AppLayout";
import { LoginPage } from "./pages/auth/LoginPage";
import { HodDashboardPage } from "./pages/hod/HodDashboardPage";
import { AllRecommendationsPage as HodAllRecommendationsPage } from "./pages/hod/AllRecommendationsPage";
import { PriorityPage as HodPriorityPage } from "./pages/hod/PriorityPage";
import { AllRecommendationsPage } from "./pages/librarian/AllRecommendationsPage";
import { ExportDataPage } from "./pages/librarian/ExportDataPage";
import { LibrarianDashboardPage } from "./pages/librarian/LibrarianDashboardPage";
import { OrderTimePeriodsPage } from "./pages/librarian/OrderTimePeriodsPage";
import { EmailAnnouncementsPage } from "./pages/librarian/EmailAnnouncementsPage";
import { LecturerDashboardPage } from "./pages/lecturer/LecturerDashboardPage";
import { MyRecommendationsPage } from "./pages/lecturer/MyRecommendationsPage";
import { SubmitRequestPage } from "./pages/lecturer/SubmitRequestPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { CreateUserPage } from "./pages/admin/CreateUserPage";
import { UsersListPage } from "./pages/admin/UsersListPage";
import { createUser as apiCreateUser } from "./api";
import "./styles/librarian.css";

function App() {
  const [session, setSession] = useState(null);
  const [view, setView] = useState("dashboard");
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, highPriority: 0 });
  const [allFilter, setAllFilter] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("book-rec-theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("book-rec-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    const stored = localStorage.getItem("book-rec-session");
    if (stored) {
      setSession(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    fetchRecommendations(session.token, session.user.role).then((records) => {
      setItems(records);
      fetchStats(session.token, records).then(setStats);
    });
  }, [session]);

  const allowedViews = useMemo(() => {
    if (!session || !session.user || !session.user.role) return [];
    return roleViews[session.user.role] || [];
  }, [session]);

  const handleViewChange = (nextView) => {
    if (nextView === "all") {
      setAllFilter("all");
    }
    setView(nextView);
  };

  async function handleLogin(email, password) {
    const nextSession = await login(email, password);
    localStorage.setItem("book-rec-session", JSON.stringify(nextSession));
    setSession(nextSession);
    setView("dashboard");
  }

  async function logout() {
    if (session?.token) {
      await apiLogout(session.token);
    }
    localStorage.removeItem("book-rec-session");
    setSession(null);
    setItems([]);
  }

  async function handleCreate(payload) {
    if (!session) {
      return;
    }

    const created = await createRecommendation(session.token, payload);
    const next = [created, ...items];
    setItems(next);
    setStats({
      total: next.length,
      pending: next.filter((item) => item.status !== "approved").length,
      approved: next.filter((item) => item.status === "approved").length,
      highPriority: next.filter((item) => item.priority === "high").length
    });
    setView("my");
  }

  async function handlePriority(id, priority) {
    if (!session) {
      return;
    }

    await updatePriority(session.token, id, priority);

    const nextItems = items.map((item) =>
      item._id === id ? { ...item, priority, status: "under_review" } : item
    );

    setItems(nextItems);
    setStats({
      total: nextItems.length,
      pending: nextItems.filter((item) => item.status === "submitted" || item.status === "under_review").length,
      approved: nextItems.filter((item) => item.status === "approved").length,
      highPriority: nextItems.filter((item) => item.priority === "high").length
    });
  }

  async function handleUserCreation(userData) {
    if (!session) return;
    await apiCreateUser(session.token, userData);
  }

  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <AppLayout
      user={session.user}
      view={view}
      allowedViews={allowedViews}
      onViewChange={handleViewChange}
      onLogout={logout}
      viewActions={null}
      theme={theme}
      onToggleTheme={toggleTheme}
    >
      {session.user.role === "lecturer" && view === "dashboard" && <LecturerDashboardPage user={session.user} stats={stats} items={items} />}
      {session.user.role === "lecturer" && view === "submit" && <SubmitRequestPage onSubmit={handleCreate} />}
      {session.user.role === "lecturer" && view === "my" && <MyRecommendationsPage items={items} />}

      {session.user.role === "hod" && view === "dashboard" && (
        <HodDashboardPage
          user={session.user}
          stats={stats}
          items={items}
          onHighPriorityClick={() => {
            setAllFilter("high");
            setView("all");
          }}
        />
      )}
      {session.user.role === "hod" && view === "priority" && <HodPriorityPage items={items} onPriority={handlePriority} />}
      {session.user.role === "hod" && view === "all" && <HodAllRecommendationsPage items={items} filterPriority={allFilter} />}

      {session.user.role === "librarian" && view === "dashboard" && <LibrarianDashboardPage user={session.user} stats={stats} items={items} onHighPriorityClick={() => { setAllFilter("high"); setView("all"); }} />}
      {session.user.role === "librarian" && view === "all" && <AllRecommendationsPage items={items} filterPriority={allFilter} />}
      {session.user.role === "librarian" && view === "periods" && <OrderTimePeriodsPage onViewChange={setView} onSelectPeriod={setSelectedPeriod} />}
      {session.user.role === "librarian" && view === "announcements" && <EmailAnnouncementsPage selectedPeriod={selectedPeriod} />}
      {session.user.role === "librarian" && view === "export" && <ExportDataPage items={items} />}

      {session.user.role === "admin" && view === "dashboard" && (
        <AdminDashboard user={session.user} token={session.token} items={items} />
      )}
      {session.user.role === "admin" && view === "users" && <UsersListPage token={session.token} />}
      {session.user.role === "admin" && view === "createUser" && <CreateUserPage onCreateUser={handleUserCreation} />}
    </AppLayout>
  );
}

export default App;
