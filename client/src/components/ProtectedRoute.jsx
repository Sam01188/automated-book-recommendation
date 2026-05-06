import { Navigate } from "react";

export function ProtectedRoute({ session, children }) {
  if (!session || session.user.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return children;
}
