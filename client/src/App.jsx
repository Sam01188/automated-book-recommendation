import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, UserPlus, Users, X } from "lucide-react";
import {
  createRecommendation,
  fetchRecommendations,
  fetchLecturerNotifications,
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
import { HodOrderStatusPage } from "./pages/hod/HodOrderStatusPage";
import { AllRecommendationsPage } from "./pages/librarian/AllRecommendationsPage";
import { ExportDataPage } from "./pages/librarian/ExportDataPage";
import { InformLecturerPage } from "./pages/librarian/InformLecturerPage";
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

function getReadNotificationIds(storageKey) {
  try {
    const ids = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : [];
  } catch {
    localStorage.removeItem(storageKey);
    return [];
  }
}

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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [lecturerNotifications, setLecturerNotifications] = useState([]);
  const [orderToast, setOrderToast] = useState(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("book-rec-theme") || "dark";
  });

  const markNotificationAsRead = (notificationId) => {
    if (!session || session.user.role !== "lecturer") return;

    const storageKey = `book-rec-order-notifications-read:${session.user.id}`;
    const readNotificationIds = new Set(getReadNotificationIds(storageKey));
    readNotificationIds.add(notificationId);
    localStorage.setItem(storageKey, JSON.stringify([...readNotificationIds]));
    setLecturerNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification
      )
    );
  };

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

  const syncSelectedPeriod = (periodList) => {
    const closedPeriods = [...periodList].sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
    const fallbackPeriod = closedPeriods.find((period) => period.status === "closed") || resolveLibrarianDisplayPeriod(periodList);

    setSelectedPeriod((current) => {
      if (current === "all") {
        return "all";
      }

      if (current) {
        const hasCurrentSelection = periodList.some((period) => String(period._id) === String(current));
        if (hasCurrentSelection) {
          return current;
        }
      }

      return fallbackPeriod?._id || null;
    });
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
    } else if (session.user.role === "librarian") {
      fetchOrderPeriods(session.token)
        .then((res) => {
          const hodPeriod = res.find((period) => period.status === "hod_priority") || null;
          setPeriods(res);
          setIsHodPeriodOpen(Boolean(hodPeriod));
          setCurrentHodPeriod(hodPeriod);
        })
        .catch((err) => console.error(err));
    }
  };

  useEffect(() => {
    if (!session || session.user.mustChangePassword || session.user.role !== "hod" || view !== "submissions") {
      return undefined;
    }

    const refreshHodPeriods = () => {
      Promise.all([fetchOrderPeriods(session.token), fetchCurrentHodPeriod(session.token)])
        .then(([periodList, hodPeriod]) => {
          setPeriods(periodList);
          setIsHodPeriodOpen(hodPeriod.isOpen);
          setCurrentHodPeriod(hodPeriod.period);
        })
        .catch((err) => console.error("Failed to refresh HoD periods:", err));
    };

    refreshHodPeriods();
    const interval = setInterval(refreshHodPeriods, 10000);
    return () => clearInterval(interval);
  }, [session, view]);

  useEffect(() => {
    if (!session || session.user.mustChangePassword || session.user.role !== "lecturer") {
      setLecturerNotifications([]);
      setOrderToast(null);
      return undefined;
    }

    let active = true;
    const seenStorageKey = `book-rec-order-notifications-seen:${session.user.id}`;
    const readStorageKey = `book-rec-order-notifications-read:${session.user.id}`;
    let seenNotificationIds = new Set();
    try {
      seenNotificationIds = new Set(JSON.parse(localStorage.getItem(seenStorageKey) || "[]"));
    } catch {
      localStorage.removeItem(seenStorageKey);
    }

    const refreshNotifications = async () => {
      try {
        const notifications = await fetchLecturerNotifications(session.token);
        if (!active) return;

        const unseenNotification = notifications.find((notification) => !seenNotificationIds.has(notification.id));
        if (unseenNotification) {
          setOrderToast(unseenNotification);
          seenNotificationIds.add(unseenNotification.id);
          localStorage.setItem(seenStorageKey, JSON.stringify([...seenNotificationIds]));
        }
        const readNotificationIds = new Set(getReadNotificationIds(readStorageKey));
        setLecturerNotifications(notifications.map((notification) => ({
          ...notification,
          isRead: readNotificationIds.has(notification.id)
        })));
      } catch (err) {
        console.error("Failed to refresh lecturer notifications:", err);
      }
    };

    refreshNotifications();
    const interval = setInterval(refreshNotifications, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [session]);

  useEffect(() => {
    if (!orderToast) return undefined;

    const timeout = setTimeout(() => setOrderToast(null), 8000);
    return () => clearTimeout(timeout);
  }, [orderToast]);

  const librarianDisplayPeriod = useMemo(() => resolveLibrarianDisplayPeriod(periods), [periods]);
  const canExportData = true;

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
        .then((s) => setStats({
          ...s,
          total: session.user.role === "librarian" ? derived.total : s.total,
          pending: derived.pending,
          lecturersCount: derived.lecturersCount
        }))
        .catch(() => setStats(derived));
    });

    // Fetch periods for filtering
    if (session.user.role === "lecturer") {
      fetchCurrentPeriod(session.token)
        .then((res) => {
          const activePeriod = res.period ? [res.period] : [];
          setPeriods(activePeriod);
          setSelectedPeriod((current) => {
            if (current && current !== "all") {
              return current;
            }
            return res.period?._id || null;
          });
        })
        .catch((err) => console.error("Failed to fetch periods:", err));
    } else if (session.user.role === "hod") {
      fetchOrderPeriods(session.token)
        .then(setPeriods)
        .catch((err) => console.error("Failed to fetch HoD periods:", err));
    } else if (session.user.role === "librarian") {
      fetchOrderPeriods(session.token)
        .then((res) => {
          setPeriods(res);
          syncSelectedPeriod(res);
          const hodPeriod = res.find((period) => period.status === "hod_priority") || null;
          setCurrentHodPeriod(hodPeriod);
          setIsHodPeriodOpen(Boolean(hodPeriod));
        })
        .catch((err) => console.error("Failed to fetch librarian periods:", err));
    }

    refreshPeriodStatus();
  }, [session]);

  useEffect(() => {
    if (!session || session.user.mustChangePassword || session.user.role !== "librarian") return;

    const refreshLibrarianState = () => {
      Promise.all([fetchRecommendations(session.token, session.user.role), fetchOrderPeriods(session.token)])
        .then(([records, periodList]) => {
          setItems(records);
          setPeriods(periodList);
          syncSelectedPeriod(periodList);
          const hodPeriod = periodList.find((period) => period.status === "hod_priority") || null;
          setCurrentHodPeriod(hodPeriod);
          setIsHodPeriodOpen(Boolean(hodPeriod));
          const derived = deriveStats(records, session.user.role);
          fetchStats(session.token, records)
            .then((s) => setStats({
              ...s,
              total: derived.total,
              pending: derived.pending,
              lecturersCount: derived.lecturersCount
            }))
            .catch(() => setStats(derived));
        })
        .catch((err) => console.error("Failed to refresh librarian recommendations:", err));
    };

    refreshLibrarianState();
    const interval = setInterval(refreshLibrarianState, 5000);

    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (!session || session.user.mustChangePassword || session.user.role !== "librarian") {
      return undefined;
    }

    const interval = setInterval(() => {
      Promise.all([fetchRecommendations(session.token, session.user.role), fetchOrderPeriods(session.token)])
        .then(([records, periodList]) => {
          setItems(records);
          setPeriods(periodList);
          syncSelectedPeriod(periodList);
          const hodPeriod = periodList.find((period) => period.status === "hod_priority") || null;
          setCurrentHodPeriod(hodPeriod);
          setIsHodPeriodOpen(Boolean(hodPeriod));
          const derived = deriveStats(records, session.user.role);
          fetchStats(session.token, records)
            .then((s) => setStats({
              ...s,
              total: derived.total,
              pending: derived.pending,
              lecturersCount: derived.lecturersCount
            }))
            .catch(() => setStats(derived));
        })
        .catch((err) => console.error("Failed to polling refresh librarian recommendations:", err));
    }, 10000);

    return () => clearInterval(interval);
  }, [session]);

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

  const librarianDashboardItems = librarianDisplayPeriod
    ? items.filter((item) => {
        const itemPeriodId = item.orderPeriod?._id || item.orderPeriod;
        return itemPeriodId && String(itemPeriodId) === String(librarianDisplayPeriod._id);
      })
    : [];
  const librarianDashboardStats = deriveStats(librarianDashboardItems, "librarian");

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
      notifications={lecturerNotifications}
      notificationsOpen={notificationsOpen}
      onToggleNotifications={() => setNotificationsOpen((open) => !open)}
      onMarkNotificationRead={markNotificationAsRead}
    >
      {orderToast && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            position: "fixed",
            top: "1rem",
            right: "1rem",
            zIndex: 2000,
            display: "grid",
            gridTemplateColumns: "1.75rem minmax(0, 1fr) 2rem",
            alignItems: "start",
            gap: "0.75rem",
            width: "min(420px, calc(100vw - 2rem))",
            padding: "1rem",
            boxSizing: "border-box",
            color: "var(--text)",
            background: "var(--surface-solid)",
            opacity: 1,
            border: "1px solid var(--primary)",
            borderRadius: "var(--radius)",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.24)"
          }}
        >
          <CheckCircle2 size={22} color="var(--success)" aria-hidden="true" />
          <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
            <strong style={{ display: "block", marginBottom: "0.35rem", lineHeight: 1.25 }}>Library order update</strong>
            <div style={{ fontWeight: 700, lineHeight: 1.35, marginBottom: "0.2rem" }}>{orderToast.title}</div>
            <span style={{ color: "var(--text-muted)", lineHeight: 1.4 }}>The library has ordered this book.</span>
            <button
              type="button"
              onClick={() => {
                markNotificationAsRead(orderToast.id);
                setOrderToast(null);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                marginTop: "0.65rem",
                padding: "0.35rem 0.6rem",
                color: "var(--primary)",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 600
              }}
            >
              <CheckCircle2 size={15} aria-hidden="true" />
              Mark as read
            </button>
          </div>
          <button
            type="button"
            aria-label="Dismiss order notification"
            title="Dismiss notification"
            onClick={() => setOrderToast(null)}
            style={{
              display: "grid",
              placeItems: "center",
              width: "2rem",
              height: "2rem",
              flexShrink: 0,
              color: "var(--text-muted)",
              background: "transparent",
              border: 0,
              cursor: "pointer"
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}
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
        <HodSubmissionsPage
          token={session.token}
          currentUserId={session.user.id}
          periods={periods}
          currentPeriod={currentHodPeriod}
        />
      )}
      {!passwordChangeRequired && session.user.role === "hod" && currentView === "status" && (
        <HodOrderStatusPage token={session.token} />
      )}

      {!passwordChangeRequired && session.user.role === "librarian" && currentView === "dashboard" && (
        <LibrarianDashboardPage
          user={session.user}
          stats={librarianDashboardStats}
          items={librarianDashboardItems}
          onTotalClick={() => setView("all")}
          onPendingClick={() => setView("all")}
          onHighPriorityClick={() => {
            setAllFilter("high");
            setView("all");
          }}
        />
      )}
      {!passwordChangeRequired && session.user.role === "librarian" && currentView === "all" && (
        <AllRecommendationsPage
          items={items}
          filterPriority={allFilter}
          currentPeriod={resolveLibrarianDisplayPeriod(periods)}
          periods={periods}
          selectedPeriod={selectedPeriod}
          onSelectedPeriodChange={setSelectedPeriod}
        />
      )}
      {!passwordChangeRequired && session.user.role === "librarian" && currentView === "periods" && (
        <OrderTimePeriodsPage
          token={session.token}
          onViewChange={setView}
          onSelectPeriod={setSelectedPeriod}
        />
      )}
      {!passwordChangeRequired && session.user.role === "librarian" && currentView === "export" && (
        <ExportDataPage
          items={items}
          isExportLocked={!canExportData}
          periods={periods}
          selectedPeriod={selectedPeriod}
          onSelectedPeriodChange={setSelectedPeriod}
        />
      )}
      {!passwordChangeRequired && session.user.role === "librarian" && currentView === "inform" && (
        <InformLecturerPage
          items={items}
          periods={periods}
          token={session.token}
        />
      )}

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
