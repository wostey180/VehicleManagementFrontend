import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import { AdminDashboard, StaffDashboard, CustomerDashboard } from "./pages/Dashboards";

const roleRedirect: Record<string, string> = {
  Admin: "/admin",
  Staff: "/staff",
  Customer: "/customer",
};

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <>{children}</>;
  return <Navigate to={roleRedirect[user.role] || "/customer"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/verify-email" element={<GuestRoute><VerifyEmailPage /></GuestRoute>} />

      <Route path="/admin" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/staff" element={<ProtectedRoute allowedRoles={["Staff"]}><StaffDashboard /></ProtectedRoute>} />
      <Route path="/customer" element={<ProtectedRoute allowedRoles={["Customer"]}><CustomerDashboard /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}