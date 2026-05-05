import { BookMarked, ClipboardList, Download, Home, ListChecks, LogOut, Send, UserCircle } from "lucide-react";
import type { Role, User } from "../types";

export type View = "dashboard" | "submit" | "my" | "priority" | "all" | "export";

export const roleViews: Record<Role, View[]> = {
  lecturer: ["dashboard", "submit", "my"],
  hod: ["dashboard", "priority", "all"],
  librarian: ["dashboard", "all", "export"]
};

export const viewLabels: Record<View, string> = {
  dashboard: "Dashboard",
  submit: "Submit Request",
  my: "My Requests",
  priority: "Pending Priority",
  all: "All Recommendations",
  export: "Export Data"
};

export const viewIcons = {
  dashboard: Home,
  submit: Send,
  my: ClipboardList,
  priority: ListChecks,
  all: BookMarked,
  export: Download
};

interface AppLayoutProps {
  user: User;
  view: View;
  allowedViews: View[];
  onViewChange: (view: View) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function AppLayout({ user, view, allowedViews, onViewChange, onLogout, children }: AppLayoutProps) {
  const ActiveIcon = viewIcons[view];

  return (
    <div className="app-frame">
      <Header user={user} onLogout={onLogout} />
      <div className="workspace">
        <aside className="sidebar" aria-label="Primary navigation">
          {allowedViews.map((item) => {
            const Icon = viewIcons[item];
            return (
              <button key={item} className={view === item ? "nav-item active" : "nav-item"} onClick={() => onViewChange(item)}>
                <Icon size={15} />
                <span>{viewLabels[item]}</span>
              </button>
            );
          })}
        </aside>

        <main className="content">
          <div className="view-title">
            <ActiveIcon size={18} />
            <span>{viewLabels[view]}</span>
          </div>
          {children}
        </main>
      </div>
      <footer className="footer">
        <span>© 2026 University of Ruhuna</span>
        <span>Version 1.0</span>
      </footer>
    </div>
  );
}

function Header({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <header className="topbar">
      <div className="brand">
        <img src="/ruhuna.gif" alt="University of Ruhuna" className="logo" />
        <div>
          <h1>University of Ruhuna - Engineering Library</h1>
          <p>Book Recommendation System</p>
        </div>
      </div>
      <div className="userbar">
        <span>
          {user.role === "librarian" ? "Mr." : "Dr."} {user.name}
        </span>
        <UserCircle size={17} />
        <button className="ghost-button" onClick={onLogout}>
          Logout
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
