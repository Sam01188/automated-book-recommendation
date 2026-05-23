import React, { useState } from "react";
import { BookMarked, ClipboardList, Download, Home, ListChecks, LogOut, Send, UserCircle, Users, UserPlus, Clock, Mail, ChevronLeft, ChevronRight } from "lucide-react";

export const roleViews = {
  lecturer: ["dashboard", "submit", "my"],
  hod: ["dashboard", "priority", "all"],
  librarian: ["dashboard", "all", "periods", "announcements", "export"],
  admin: ["dashboard", "users", "createUser"]
};

export const viewLabels = {
  dashboard: "Dashboard",
  submit: "Submit Request",
  my: "My Requests",
  priority: "Pending Priority",
  all: "All Recommendations",
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
  periods: Clock,
  announcements: Mail,
  export: Download,
  users: Users,
  createUser: UserPlus
};

export function AppLayout({ user, view, allowedViews, onViewChange, onLogout, viewActions, children }) {
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const ActiveIcon = viewIcons[view] || Home;

  return (
    <div className="app-frame">
      <header className="topbar">
        <div className="brand">
          <img src="/ruhuna.gif" alt="University of Ruhuna" className="logo" />
          <div>
            <h1>University of Ruhuna</h1>
            <p>Faculty of Engineering • Library Portal</p>
          </div>
        </div>
        <div className="userbar">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <UserCircle size={32} color="var(--primary)" />
          <button className="secondary-button" onClick={onLogout} style={{ padding: '0.5rem 1rem' }}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className={`sidebar ${sidebarMinimized ? 'minimized' : ''}`}>
          <button 
            className="sidebar-toggle-btn"
            onClick={() => setSidebarMinimized(!sidebarMinimized)}
            title={sidebarMinimized ? "Expand sidebar" : "Minimize sidebar"}
          >
            {sidebarMinimized ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          
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
