import React, { useState } from "react";
import { BookMarked, ClipboardList, Download, Home, ListChecks, LogOut, Send, UserCircle, Users, UserPlus, Clock, Mail, ChevronLeft, ChevronRight, Sun, Moon } from "lucide-react";

export const roleViews = {
  lecturer: ["dashboard", "submit", "my"],
  hod: ["dashboard", "priority", "all", "submissions"],
  librarian: ["dashboard", "all", "periods", "announcements", "export"],
  admin: ["dashboard", "users", "createUser"]
};

export const viewLabels = {
  dashboard: "Dashboard",
  submit: "Submit Request",
  my: "My Requests",
  priority: "Assign/Edit Priority",
  all: "All Recommendations",
  submissions: "Submissions",
  periods: "Order Periods",
  announcements: "Email Announcements",
  export: "Export Data",
  users: "User Management",
  createUser: "Create New User"
};

export const viewIcons = {
  dashboard: Home,
  submit: Send,
  my: ClipboardList,
  priority: ListChecks,
  all: BookMarked,
  submissions: ClipboardList,
  periods: Clock,
  announcements: Mail,
  export: Download,
  users: Users,
  createUser: UserPlus
};

export function AppLayout({ user, view, allowedViews, onViewChange, onLogout, viewActions, theme, onToggleTheme, children }) {
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const ActiveIcon = viewIcons[view] || Home;

  return (
    <div className="app-frame">
      <header className="topbar">
        <div className="brand">
          <img src="/ruhuna.gif" alt="University of Ruhuna" className="logo" />
          <div>
            <h1>University of Ruhuna</h1>
            <p>Faculty of Engineering • Book Recommendation Portal</p>
          </div>
        </div>
        <div className="userbar">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <UserCircle size={32} color="var(--primary)" />
          
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
