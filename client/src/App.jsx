import { useEffect, useMemo, useState } from "react";
import { UserPlus, Users } from "lucide-react";
import {
  createRecommendation,
  fetchRecommendations,
  fetchStats,
  login,
  logout as apiLogout,
  submitToLibrarian,
  updateRecommendationOrder,
  fetchCurrentPeriod,
  fetchCurrentHodPeriod,
  fetchOrderPeriods,
  createUser as apiCreateUser
} from "./api";
import { AppLayout, roleViews } from "./components/AppLayout";
import { LoginPage } from "./pages/auth/LoginPage";
import { HodDashboardPage } from "./pages/hod/HodDashboardPage";
import { AllRecommendationsPage as HodAllRecommendationsPage } from "./pages/hod/AllRecommendationsPage";
import { PriorityPage as HodPriorityPage } from "./pages/hod/PriorityPage";
import { HodSubmissionsPage } from "./pages/hod/HodSubmissionsPage";
import { AllRecommendationsPage } from "./pages/librarian/AllRecommendationsPage";
import { ExportDataPage } from "./pages/librarian/ExportDataPage";
import { LibrarianDashboardPage } from "./pages/librarian/LibrarianDashboardPage";
import { OrderTimePeriodsPage } from "./pages/librarian/OrderTimePeriodsPage";
import { LecturerDashboardPage } from "./pages/lecturer/LecturerDashboardPage";
import { MyRecommendationsPage } from "./pages/lecturer/MyRecommendationsPage";
import { SubmitRequestPage } from "./pages/lecturer/SubmitRequestPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { CreateUserPage } from "./pages/admin/CreateUserPage";
import { UsersListPage } from "./pages/admin/UsersListPage";
import "./styles/librarian.css";

function App() {
  const [session, setSession] = useState(null);
  const [view, setView] = useState("dashboard");
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, rejected: 0, highPriority: 0 });
  const [allFilter, setAllFilter] = useState("all");
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [currentHodPeriod, setCurrentHodPeriod] = useState(null);
  const [isHodPeriodOpen, setIsHodPeriodOpen] = useState(false);
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

  const refreshPeriodStatus = () => {
    if (!session) return;
    if (session.user.role === "lecturer") {
      fetchCurrentPeriod(session.token)
        .then((res) => {
          setIsPeriodOpen(res.isOpen);
          setCurrentPeriod(res.period);
        })
        .catch((err) => console.error(err));
    } else if (session.user.role === "hod") {
      fetchCurrentHodPeriod(session.token)
        .then((res) => {
          setIsHodPeriodOpen(res.isOpen);
          setCurrentHodPeriod(res.period);
        })
        .catch((err) => console.error(err));
    }
  };

  useEffect(() => {
    if (!session) {
      return;
    }

    fetchRecommendations(session.token, session.user.role).then((records) => {
      setItems(records);
      fetchStats(session.token, records).then(setStats);
    });

    // Fetch periods for filtering
    if (session.user.role === "lecturer") {
      fetchOrderPeriods(session.token)
        .then((res) => {
          setPeriods(res);
          // Set current period as default selected period
          if (res.length > 0) {
            const currentPeriod = res.find((p) => p.status === "open") || res[res.length - 1];
            setSelectedPeriod(currentPeriod._id);
          }
        })
        .catch((err) => console.error("Failed to fetch periods:", err));
    }

    refreshPeriodStatus();
  }, [session]);

  const allowedViews = useMemo(() => {
    if (!session || !session.user || !session.user.role) return [];
    return roleViews[session.user.role] || [];
  }, [session]);

  const deriveStats = (records, role = session?.user?.role) => ({
    total: records.length,
    pending:
      role === "hod"
        ? records.filter(
            (item) =>
              item.status === "under_review" ||
              (item.status === "submitted" && !item.reviewedBy)
          ).length
        : records.filter((item) => item.status === "submitted" || item.status === "under_review").length,
    rejected: records.filter((item) => item.status === "rejected").length,
    highPriority: records.filter((item) => item.priorityRank === 1).length
  });

  useEffect(() => {
    setStats(deriveStats(items, session?.user?.role));
  }, [items, session?.user?.role]);

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
    setStats(deriveStats(next, session.user.role));
    setView("my");
  }


  async function handleRecommendationOrder(orderedIds) {
    if (!session) {
      return;
    }

    const updatedRecords = await updateRecommendationOrder(session.token, orderedIds);
    setItems(updatedRecords);
    setStats(deriveStats(updatedRecords, session.user.role));
  }

  async function handleSubmitToLibrarian() {
    if (!session) return;

    const updatedRecords = await submitToLibrarian(session.token);
    setItems(updatedRecords);
    setStats(deriveStats(updatedRecords, session.user.role));
    setView("submissions");
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
      {session.user.role === "lecturer" && view === "dashboard" && (
        <LecturerDashboardPage
          user={session.user}
          stats={stats}
          items={items}
          isPeriodOpen={isPeriodOpen}
          currentPeriod={currentPeriod}
          onTotalClick={() => setView("my")}
          onPendingClick={() => setView("my")}
          onRejectedClick={() => setView("my")}
        />
      )}
      {session.user.role === "lecturer" && view === "submit" && (
        <SubmitRequestPage
          onSubmit={handleCreate}
          isPeriodOpen={isPeriodOpen}
          currentPeriod={currentPeriod}
        />
      )}
      {session.user.role === "lecturer" && view === "my" && (
        <MyRecommendationsPage
          items={items}
          isPeriodOpen={isPeriodOpen}
          currentPeriod={currentPeriod}
          token={session.token}
          periods={periods}
          selectedPeriod={selectedPeriod}
          onSelectedPeriodChange={setSelectedPeriod}
          onItemsUpdate={(newItems) => {
            setItems(newItems);
            setStats(deriveStats(newItems, session.user.role));
          }}
        />
      )}

      {session.user.role === "hod" && view === "dashboard" && (
        <HodDashboardPage
          user={session.user}
          stats={stats}
          items={items}
          isPeriodOpen={isHodPeriodOpen}
          currentPeriod={currentHodPeriod}
          onTotalClick={() => setView("submissions")}
          onPendingClick={() => setView("priority")}
          onHighPriorityClick={() => {
            setAllFilter("high");
            setView("all");
          }}
        />
      )}
      {session.user.role === "hod" && view === "priority" && (
        <HodPriorityPage
          items={items}
          onOrderChange={handleRecommendationOrder}
          isPeriodOpen={isHodPeriodOpen}
          currentPeriod={currentHodPeriod}
          onSubmit={handleSubmitToLibrarian}
        />
      )}
      {session.user.role === "hod" && view === "all" && (
        <HodAllRecommendationsPage
          items={items}
          filterPriority={allFilter}
          onOrderChange={handleRecommendationOrder}
          onSubmit={handleSubmitToLibrarian}
          isPeriodOpen={isHodPeriodOpen}
          currentPeriod={currentHodPeriod}
        />
      )}
      {session.user.role === "hod" && view === "submissions" && (
        <HodSubmissionsPage items={items} currentUserId={session.user.id} />
      )}

      {session.user.role === "librarian" && view === "dashboard" && (
        <LibrarianDashboardPage
          user={session.user}
          stats={stats}
          items={items}
          onTotalClick={() => setView("all")}
          onPendingClick={() => setView("all")}
          onHighPriorityClick={() => {
            setAllFilter("high");
            setView("all");
          }}
        />
      )}
      {session.user.role === "librarian" && view === "all" && (
        <AllRecommendationsPage items={items} filterPriority={allFilter} />
      )}
      {session.user.role === "librarian" && view === "periods" && (
        <OrderTimePeriodsPage
          token={session.token}
          onViewChange={setView}
          onSelectPeriod={setSelectedPeriod}
        />
      )}
      {session.user.role === "librarian" && view === "export" && <ExportDataPage items={items} />}

      {session.user.role === "admin" && view === "dashboard" && (
        <AdminDashboard user={session.user} token={session.token} items={items} />
      )}
      {session.user.role === "admin" && view === "users" && <UsersListPage token={session.token} />}
      {session.user.role === "admin" && view === "createUser" && (
        <CreateUserPage onCreateUser={handleUserCreation} />
      )}
    </AppLayout>
  );
}

export default App;
