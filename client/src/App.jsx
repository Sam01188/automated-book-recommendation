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
  resetRecommendationOrder,
  fetchCurrentPeriod,
  fetchCurrentHodPeriod,
  fetchOrderPeriods,
  createUser as apiCreateUser,
  importUsers as apiImportUsers,
  changePassword,
  updateProfile,
  requestPasswordReset,
  resetPassword
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
import { AuditLogPage } from "./pages/admin/AuditLogPage";
import { CreateUserPage } from "./pages/admin/CreateUserPage";
import { UsersListPage } from "./pages/admin/UsersListPage";
import { ProfilePage } from "./pages/ProfilePage";
import "./styles/librarian.css";

function App() {
  const [session, setSession] = useState(null);
  const [view, setView] = useState("dashboard");
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, rejected: 0, highPriority: 0, lecturersCount: 0 });
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

  const resolveLibrarianDisplayPeriod = (periods) => {
    if (!Array.isArray(periods) || periods.length === 0) {
      return null;
    }

    return (
      periods.find((period) => period.status === "open" || period.status === "hod_priority") ||
      periods.find((period) => period.status === "closed") ||
      null
    );
  };

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
    if (!session || session.user.mustChangePassword) return;
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
    if (!session || session.user.mustChangePassword) {
      return;
    }

    fetchRecommendations(session.token, session.user.role).then((records) => {
      setItems(records);
      // derive client-side stats (ensure HOD pending reflects unassigned items)
      const derived = deriveStats(records, session.user.role);
      // fetch server stats but merge with derived pending/lecturersCount
      fetchStats(session.token, records)
        .then((s) => setStats({ ...s, pending: derived.pending, lecturersCount: derived.lecturersCount }))
        .catch(() => setStats(derived));
    });

    // Fetch periods for filtering
    if (session.user.role === "lecturer") {
      fetchCurrentPeriod(session.token)
        .then((res) => {
          const activePeriod = res.period ? [res.period] : [];
          setPeriods(activePeriod);
          setSelectedPeriod(res.period?._id || null);
        })
        .catch((err) => console.error("Failed to fetch periods:", err));
    } else if (session.user.role === "librarian") {
      fetchOrderPeriods(session.token)
        .then((res) => {
          setPeriods(res);
          setSelectedPeriod(resolveLibrarianDisplayPeriod(res)?._id || null);
        })
        .catch((err) => console.error("Failed to fetch librarian periods:", err));
    }

    refreshPeriodStatus();
  }, [session]);

  useEffect(() => {
    if (!session || session.user.mustChangePassword) return;
    if (session.user.role === "librarian" && (view === "all" || view === "export")) {
      Promise.all([fetchRecommendations(session.token, session.user.role), fetchOrderPeriods(session.token)])
        .then(([records, periodList]) => {
          setItems(records);
          setPeriods(periodList);
          setSelectedPeriod(resolveLibrarianDisplayPeriod(periodList)?._id || null);
          const derived = deriveStats(records, session.user.role);
          fetchStats(session.token, records)
            .then((s) => setStats({ ...s, pending: derived.pending, lecturersCount: derived.lecturersCount }))
            .catch(() => setStats(derived));
        })
        .catch((err) => console.error("Failed to refresh librarian recommendations:", err));
    }
  }, [session, view]);

  useEffect(() => {
    if (!session || session.user.mustChangePassword || session.user.role !== "librarian" || view !== "all") {
      return undefined;
    }

    const interval = setInterval(() => {
      Promise.all([fetchRecommendations(session.token, session.user.role), fetchOrderPeriods(session.token)])
        .then(([records, periodList]) => {
          setItems(records);
          setPeriods(periodList);
          setSelectedPeriod(resolveLibrarianDisplayPeriod(periodList)?._id || null);
          const derived = deriveStats(records, session.user.role);
          fetchStats(session.token, records)
            .then((s) => setStats({ ...s, pending: derived.pending, lecturersCount: derived.lecturersCount }))
            .catch(() => setStats(derived));
        })
        .catch((err) => console.error("Failed to polling refresh librarian recommendations:", err));
    }, 10000);

    return () => clearInterval(interval);
  }, [session, view]);

  const allowedViews = useMemo(() => {
    if (!session || !session.user || !session.user.role) return [];
    return roleViews[session.user.role] || [];
  }, [session]);

  const deriveStats = (records, role = session?.user?.role) => {
    const total = records.length;
    // For HOD dashboard, pending should reflect number of items with an assigned priority number
    const pending =
      role === "hod"
        ? records.filter((item) => Number.isFinite(item.priorityRank)).length
        : records.filter((item) => item.status === "submitted" || item.status === "under_review").length;
    const rejected = records.filter((item) => item.status === "rejected").length;
    const highPriority = records.filter((item) => item.priorityRank === 1).length;
    // Count distinct lecturers who submitted books (exclude null submitters and rejected items)
    const lecturerIds = new Set(records.filter(r => r.submittedBy && r.status !== 'rejected').map(r => r.submittedBy._id || r.submittedBy));
    const lecturersCount = lecturerIds.size;
    return { total, pending, rejected, highPriority, lecturersCount };
  };


  useEffect(() => {
    setStats(deriveStats(items, session?.user?.role));
  }, [items, session?.user?.role]);

  const handleViewChange = (nextView) => {
    if (session?.user.mustChangePassword && nextView !== "profile") return;
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

  async function handlePasswordChange(currentPassword, newPassword) {
    const result = await changePassword(session.token, currentPassword, newPassword);
    const nextSession = {
      ...session,
      token: result.token,
      user: { ...session.user, mustChangePassword: false }
    };
    localStorage.setItem("book-rec-session", JSON.stringify(nextSession));
    setSession(nextSession);
    setView("profile");
    return result;
  }

  async function handleProfileNameUpdate(name) {
    const result = await updateProfile(session.token, name);
    const nextSession = {
      ...session,
      user: { ...session.user, name: result.name }
    };
    localStorage.setItem("book-rec-session", JSON.stringify(nextSession));
    setSession(nextSession);
    return result;
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
    return updatedRecords;
  }

  async function handleResetRecommendationOrder() {
    if (!session) return;

    const updatedRecords = await resetRecommendationOrder(session.token);
    setItems(updatedRecords);
    setStats(deriveStats(updatedRecords, session.user.role));
  }

  async function handleSubmitToLibrarian() {
    if (!session) return;

    // Submit to librarian and refresh recommendations to ensure submitted items appear in Submissions
    const updatedRecords = await submitToLibrarian(session.token);
    // Try to fetch fresh recommendations from server to avoid any stale state
    try {
      const fresh = await fetchRecommendations(session.token, session.user.role);
      setItems(fresh);
      setStats(deriveStats(fresh, session.user.role));
      // If server did not mark any items as submitted for this HOD, apply a client-side fallback:
      const hasSubmitted = fresh.some((r) => r.status === 'submitted' && String(r.reviewedBy?._id || r.reviewedBy) === String(session.user.id));
      if (!hasSubmitted) {
        const fallback = fresh.map((r) => {
          if (Number.isFinite(r.priorityRank) && r.status !== 'rejected') {
            return { ...r, status: 'submitted', reviewedBy: { _id: session.user.id, name: session.user.name }, submittedToLibrarianAt: new Date().toISOString() };
          }
          return r;
        });
        setItems(fallback);
        setStats(deriveStats(fallback, session.user.role));
      }
    } catch (err) {
      // Fallback to whatever submit returned
      const fallback = (updatedRecords || []).map((r) => {
        if (Number.isFinite(r.priorityRank) && r.status !== 'rejected') {
          return { ...r, status: 'submitted', reviewedBy: { _id: session.user.id, name: session.user.name }, submittedToLibrarianAt: new Date().toISOString() };
        }
        return r;
      });
      setItems(fallback);
      setStats(deriveStats(fallback, session.user.role));
    }
    setView("submissions");
    return updatedRecords;
  }

  async function handleUserCreation(userData) {
    if (!session) return;
    await apiCreateUser(session.token, userData);
  }

  async function handleUserImport(users) {
    if (!session) return;
    return apiImportUsers(session.token, users);
  }

  const resetToken = new URLSearchParams(window.location.search).get("resetToken");
  if (!session) {
    return (
      <LoginPage
        onLogin={handleLogin}
        onRequestPasswordReset={requestPasswordReset}
        onResetPassword={resetPassword}
        resetToken={resetToken}
      />
    );
  }

  const passwordChangeRequired = Boolean(session.user.mustChangePassword);
  const currentView = passwordChangeRequired ? "profile" : view;

  return (
    <AppLayout
      user={session.user}
      view={currentView}
      allowedViews={passwordChangeRequired ? [] : allowedViews}
      onViewChange={handleViewChange}
      onProfileClick={() => setView("profile")}
      navigationLocked={passwordChangeRequired}
      onLogout={logout}
      viewActions={null}
      theme={theme}
      onToggleTheme={toggleTheme}
    >
      {currentView === "profile" && (
        <ProfilePage
          user={session.user}
          passwordChangeRequired={passwordChangeRequired}
          onChangePassword={handlePasswordChange}
          onUpdateName={handleProfileNameUpdate}
        />
      )}
      {!passwordChangeRequired && session.user.role === "lecturer" && currentView === "dashboard" && (
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
      {!passwordChangeRequired && session.user.role === "lecturer" && currentView === "submit" && (
        <SubmitRequestPage
          onSubmit={handleCreate}
          isPeriodOpen={isPeriodOpen}
          currentPeriod={currentPeriod}
        />
      )}
      {!passwordChangeRequired && session.user.role === "lecturer" && currentView === "my" && (
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

      {!passwordChangeRequired && session.user.role === "hod" && currentView === "dashboard" && (
        <HodDashboardPage
          user={session.user}
          stats={stats}
          items={items}
          isPeriodOpen={isHodPeriodOpen}
          currentPeriod={currentHodPeriod}
          onTotalClick={() => setView("submissions")}
          onPendingClick={() => setView("priority")}
          onHighPriorityClick={() => {
            setAllFilter("prioritized");
            setView("all");
          }}
        />
      )}
      {!passwordChangeRequired && session.user.role === "hod" && currentView === "priority" && (
        <HodPriorityPage
          items={items}
          onOrderChange={handleRecommendationOrder}
          isPeriodOpen={isHodPeriodOpen}
          currentPeriod={currentHodPeriod}
          onSubmit={handleSubmitToLibrarian}
        />
      )}
      {!passwordChangeRequired && session.user.role === "hod" && currentView === "all" && (
        <HodAllRecommendationsPage
          items={items}
          filterPriority={allFilter}
          onOrderChange={handleRecommendationOrder}
          onSubmit={handleSubmitToLibrarian}
          isPeriodOpen={isHodPeriodOpen}
          onReset={handleResetRecommendationOrder}
          currentPeriod={currentHodPeriod}
        />
      )}
      {!passwordChangeRequired && session.user.role === "hod" && currentView === "submissions" && (
        <HodSubmissionsPage items={items} currentUserId={session.user.id} />
      )}

      {!passwordChangeRequired && session.user.role === "librarian" && currentView === "dashboard" && (
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
      {!passwordChangeRequired && session.user.role === "librarian" && currentView === "all" && (
        <AllRecommendationsPage items={items} filterPriority={allFilter} currentPeriod={resolveLibrarianDisplayPeriod(periods)} />
      )}
      {!passwordChangeRequired && session.user.role === "librarian" && currentView === "periods" && (
        <OrderTimePeriodsPage
          token={session.token}
          onViewChange={setView}
          onSelectPeriod={setSelectedPeriod}
        />
      )}
      {!passwordChangeRequired && session.user.role === "librarian" && currentView === "export" && <ExportDataPage items={items} />}

      {!passwordChangeRequired && session.user.role === "admin" && currentView === "dashboard" && (
        <AdminDashboard user={session.user} token={session.token} />
      )}
      {!passwordChangeRequired && session.user.role === "admin" && currentView === "users" && <UsersListPage token={session.token} />}
      {!passwordChangeRequired && session.user.role === "admin" && currentView === "audit" && <AuditLogPage token={session.token} />}
      {!passwordChangeRequired && session.user.role === "admin" && currentView === "createUser" && (
        <CreateUserPage token={session.token} onCreateUser={handleUserCreation} onImportUsers={handleUserImport} />
      )}
    </AppLayout>
  );
}

export default App;
