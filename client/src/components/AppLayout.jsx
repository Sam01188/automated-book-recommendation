import React, { useState } from "react";
import { BadgeCheck, BellRing, BookMarked, Check, ClipboardList, Download, Home, ListChecks, LogOut, Send, UserCircle, Users, UserPlus, Clock, ChevronLeft, ChevronRight, Sun, Moon } from "lucide-react";

export const roleViews = {
  lecturer: ["dashboard", "submit", "my"],
  hod: ["dashboard", "priority", "all", "submissions", "status"],
  librarian: ["dashboard", "all", "periods", "export", "inform"],
  admin: ["dashboard", "users", "createUser", "audit"]
};

export const viewLabels = {
  profile: "My Profile",
  dashboard: "Dashboard",
  submit: "Submit Request",
  my: "My Requests",
  priority: "Assign/Edit Priority",
  all: "All Recommendations",
  submissions: "Submissions",
  status: "Status",
  periods: "Order Periods",
  export: "Export Data",
  inform: "Inform Lecturer",
  users: "User Management",
  createUser: "Create New User",
  audit: "Audit History"
};

export const viewIcons = {
  profile: UserCircle,
  dashboard: Home,
  submit: Send,
  my: ClipboardList,
  priority: ListChecks,
  all: BookMarked,
  submissions: ClipboardList,
  status: BadgeCheck,
  periods: Clock,
  export: Download,
  inform: BellRing,
  users: Users,
  createUser: UserPlus,
  audit: ClipboardList
};

export function AppLayout({ user, view, allowedViews, onViewChange, onLogout, onProfileClick, navigationLocked = false, viewActions, theme, onToggleTheme, notifications = [], notificationsOpen = false, onToggleNotifications, onMarkNotificationRead, children }) {
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const ActiveIcon = viewIcons[view] || Home;
  const unreadNotificationCount = notifications.filter((item) => !item.isRead).length;

  return (
    <div className="app-frame" style={{ "--app-sidebar-width": sidebarMinimized ? "80px" : "280px" }}>
      <header className="topbar">
        <div className="brand">
          <img src="/ruhuna.gif" alt="University of Ruhuna" className="logo" />
          <div>
            <h1>University of Ruhuna</h1>
            <p>Faculty of Engineering • Book Recommendation Portal</p>
          </div>
        </div>
        <div className="userbar" style={{ position: "relative" }}>
          {user.role === "lecturer" && (
            <button
              type="button"
              onClick={onToggleNotifications}
              title="Notifications"
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                border: "1px solid var(--border)",
                background: "var(--surface-solid)",
                color: "var(--text)",
                cursor: "pointer"
              }}
            >
              <BellRing size={18} />
              {unreadNotificationCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  minWidth: "18px",
                  height: "18px",
                  padding: "0 4px",
                  borderRadius: "999px",
                  background: "var(--primary)",
                  color: "white",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {unreadNotificationCount}
                </span>
              )}
            </button>
          )}

          {notificationsOpen && user.role === "lecturer" && notifications.length > 0 && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 12px)",
              right: 0,
              width: "min(320px, calc(100vw - 2rem))",
              background: "var(--surface-solid)",
              opacity: 1,
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              boxShadow: "0 18px 45px rgba(0,0,0,0.2)",
              zIndex: 2000,
              padding: "0.75rem",
              maxHeight: "300px",
              overflowY: "auto"
            }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                Notifications
              </div>
              {notifications.map((item) => (
                <div key={item.id} style={{
                  padding: "0.7rem 0.75rem",
                  borderRadius: "var(--radius)",
                  background: item.isRead ? "var(--surface-solid)" : "var(--bg-layer)",
                  border: "1px solid var(--border)",
                  marginBottom: "0.5rem"
                }}>
                  <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: "0.2rem" }}>{item.title}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{item.message}</div>
                  {item.isRead ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.5rem", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                      <Check size={14} aria-hidden="true" />
                      <span>Read</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onMarkNotificationRead?.(item.id)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        marginTop: "0.5rem",
                        padding: "0.3rem 0.55rem",
                        color: "var(--primary)",
                        background: "transparent",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        fontWeight: 600
                      }}
                    >
                      <Check size={14} aria-hidden="true" />
                      Mark as read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <button className="profile-trigger" type="button" onClick={onProfileClick} title="Open profile">
            <UserCircle size={30} color="var(--primary)" />
            <span className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.role}</span>
            </span>
          </button>
          
          <button 
            className="secondary-button theme-toggle-btn" 
            onClick={onToggleTheme} 
            title={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
            style={{ 
              padding: '0.5rem', 
              minWidth: '40px', 
              minHeight: '40px', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button className="logout-button" onClick={onLogout} title="Sign out">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="workspace">
        {!navigationLocked && (
          <aside className={`sidebar ${sidebarMinimized ? 'minimized' : ''}`}>
            {allowedViews.map((item) => {
              const Icon = viewIcons[item];
              return (
                <button
                  key={item}
                  className={view === item ? "nav-item active" : "nav-item"}
                  onClick={() => onViewChange(item)}
                  title={sidebarMinimized ? viewLabels[item] : ""}
                >
                  <Icon size={20} />
                  {!sidebarMinimized && <span>{viewLabels[item]}</span>}
                </button>
              );
            })}

            <button
              className="nav-item sidebar-toggle-btn"
              onClick={() => setSidebarMinimized(!sidebarMinimized)}
              title={sidebarMinimized ? "Expand sidebar" : ""}
            >
              {sidebarMinimized ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          </aside>
        )}

        <main className="content">
          <div className="view-title-row">
            <div className="view-title">
              <ActiveIcon size={20} />
              <span>{viewLabels[view]}</span>
            </div>
            {viewActions}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
