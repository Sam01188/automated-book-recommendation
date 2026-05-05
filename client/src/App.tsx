import { useEffect, useMemo, useState } from "react";
import { createRecommendation, fetchRecommendations, fetchStats, login, updatePriority } from "./api";
import { AppLayout, roleViews, type View } from "./components/AppLayout";
import { LoginPage } from "./pages/auth/LoginPage";
import { HodDashboardPage } from "./pages/hod/HodDashboardPage";
import { AllRecommendationsPage as HodAllRecommendationsPage } from "./pages/hod/AllRecommendationsPage";
import { PriorityPage as HodPriorityPage } from "./pages/hod/PriorityPage";
import { AllSubmissionsPage } from "./pages/librarian/AllSubmissionsPage";
import { ExportDataPage } from "./pages/librarian/ExportDataPage";
import { LibrarianDashboardPage } from "./pages/librarian/LibrarianDashboardPage";
import { LecturerDashboardPage } from "./pages/lecturer/LecturerDashboardPage";
import { MyRecommendationsPage } from "./pages/lecturer/MyRecommendationsPage";
import { SubmitRequestPage } from "./pages/lecturer/SubmitRequestPage";
import type { Recommendation, Stats, User } from "./types";

function App() {
  const [session, setSession] = useState<{ token: string; user: User } | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [items, setItems] = useState<Recommendation[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, highPriority: 0 });

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

  const allowedViews = useMemo(() => (session ? roleViews[session.user.role] : []), [session]);

  async function handleLogin(username: string, password: string) {
    const nextSession = await login(username, password);
    localStorage.setItem("book-rec-session", JSON.stringify(nextSession));
    setSession(nextSession);
    setView("dashboard");
  }

  function logout() {
    localStorage.removeItem("book-rec-session");
    setSession(null);
    setItems([]);
  }

  async function handleCreate(payload: Partial<Recommendation>) {
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

  async function handlePriority(id: string, priority: Recommendation["priority"]) {
    if (!session) {
      return;
    }

    await updatePriority(session.token, id, priority);
    setItems((current) => current.map((item) => (item._id === id ? { ...item, priority, status: "under_review" } : item)));
  }

  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <AppLayout user={session.user} view={view} allowedViews={allowedViews} onViewChange={setView} onLogout={logout}>
      {session.user.role === "lecturer" && view === "dashboard" && <LecturerDashboardPage user={session.user} stats={stats} items={items} />}
      {session.user.role === "lecturer" && view === "submit" && <SubmitRequestPage onSubmit={handleCreate} />}
      {session.user.role === "lecturer" && view === "my" && <MyRecommendationsPage items={items} />}

      {session.user.role === "hod" && view === "dashboard" && <HodDashboardPage user={session.user} stats={stats} items={items} />}
      {session.user.role === "hod" && view === "priority" && <HodPriorityPage items={items} onPriority={handlePriority} />}
      {session.user.role === "hod" && view === "all" && <HodAllRecommendationsPage items={items} />}

      {session.user.role === "librarian" && view === "dashboard" && <LibrarianDashboardPage user={session.user} stats={stats} items={items} />}
      {session.user.role === "librarian" && view === "all" && <AllSubmissionsPage items={items} />}
      {session.user.role === "librarian" && view === "export" && <ExportDataPage items={items} />}
    </AppLayout>
  );
}

export default App;
