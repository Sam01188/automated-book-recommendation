import React, { useState } from "react";
import { BellRing, BookMarked, ClipboardList, Download, Home, ListChecks, LogOut, Send, UserCircle, Users, UserPlus, Clock, ChevronLeft, ChevronRight, Sun, Moon } from "lucide-react";

export const roleViews = {
  lecturer: ["dashboard", "submit", "my"],
  hod: ["dashboard", "priority", "all", "submissions"],
  librarian: ["dashboard", "all", "periods", "export", "inform"],
  admin: ["dashboard", "users", "createUser"]
};

export const viewLabels = {
  profile: "My Profile",
  dashboard: "Dashboard",
  submit: "Submit Request",
  my: "My Requests",
  priority: "Assign/Edit Priority",
  all: "All Recommendations",
  submissions: "Submissions",
  periods: "Order Periods",
  export: "Export Data",
  inform: "Inform Lecturer",
  users: "User Management",
  createUser: "Create New User"
};

export const viewIcons = {
  profile: UserCircle,
  dashboard: Home,
  submit: Send,
  my: ClipboardList,
  priority: ListChecks,
  all: BookMarked,
  submissions: ClipboardList,
  periods: Clock,
  export: Download,
  inform: BellRing,
  users: Users,
  createUser: UserPlus
};

export function AppLayout({ user, view, allowedViews, onViewChange, onLogout, onProfileClick, navigationLocked = false, viewActions, theme, onToggleTheme, notifications = [], notificationsOpen = false, onToggleNotifications, children }) {
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const ActiveIcon = viewIcons[view] || Home;

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
                background: "var(--surface)",
                color: "var(--text)",
                cursor: "pointer"
              }}
            >
              <BellRing size={18} />
              {notifications.length > 0 && (
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
                  {notifications.length}
                </span>
              )}
            </button>
          )}

          {notificationsOpen && user.role === "lecturer" && notifications.length > 0 && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 12px)",
              right: 0,
              width: "320px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              boxShadow: "0 18px 45px rgba(0,0,0,0.2)",
              zIndex: 20,
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
                  background: "var(--surface-hover)",
                  border: "1px solid var(--border)",
                  marginBottom: "0.5rem"
                }}>
                  <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: "0.2rem" }}>{item.title}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{item.message}</div>
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
