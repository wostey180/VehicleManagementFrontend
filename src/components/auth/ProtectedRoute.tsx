import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  allowedRoles?: string[];
}

const roleRedirect: Record<string, string> = {
  Admin: "/admin",
  Staff: "/staff",
  Customer: "/customer",
};

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleRedirect[user.role] || "/login"} replace />;
  }

  return <>{children}</>;
}