import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { PortalLayout } from "./components/shared/PortalLayout";

// Auth pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";

// Admin pages
import AdminHome from "./pages/admin/AdminHome";
import FinancialReports from "./pages/admin/FinancialReports";
import StaffManagement from "./pages/admin/StaffManagement";
import PartsManagement from "./pages/admin/PartsManagement";
import PurchaseInvoices from "./pages/admin/PurchaseInvoices";
import VendorManagement from "./pages/admin/VendorManagement";

// Staff pages
import StaffHome from "./pages/staff/StaffHome";
import RegisterCustomer from "./pages/staff/RegisterCustomer";
import SalesInvoices from "./pages/staff/SalesInvoices";
import AllCustomers from "./pages/staff/AllCustomers";
import CustomerSearch from "./pages/staff/CustomerSearch";
import CustomerReports from "./pages/staff/CustomerReports";
import StaffAppointments from "./pages/staff/StaffAppointments";
import StaffPartRequests from "./pages/staff/StaffPartRequests";
import ReviewsManagement from "./pages/shared/ReviewsManagement";

// Customer pages
import CustomerHome from "./pages/customer/CustomerHome";
import CustomerProfile from "./pages/customer/CustomerProfile";
import CustomerAppointments from "./pages/customer/CustomerAppointments";
import CustomerPartRequests from "./pages/customer/CustomerPartRequests";
import CustomerReviews from "./pages/customer/CustomerReviews";
import CustomerHistory from "./pages/customer/CustomerHistory";

// Nav icons
import {
  LayoutDashboard, TrendingUp, Users, Package,
  ShoppingCart, Store, Search, BarChart2,
  UserCircle, Calendar, Inbox, Star, History, FileText, MessageSquare
} from "lucide-react";

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
      {/* Auth */}
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/verify-email" element={<GuestRoute><VerifyEmailPage /></GuestRoute>} />

      {/* Admin portal */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <PortalLayout
              roleLabel="Admin Portal"
              accentColor="#C97B4A"
              pillClass="bg-[#C97B4A]/15 text-[#C97B4A] border border-[#C97B4A]/30"
              navItems={[
                { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
                { label: "Financial Reports", to: "/admin/reports", icon: TrendingUp },
                { label: "Staff", to: "/admin/staff", icon: Users },
                { label: "Parts", to: "/admin/parts", icon: Package },
                { label: "Purchase Invoices", to: "/admin/purchase-invoices", icon: ShoppingCart },
                { label: "Vendors", to: "/admin/vendors", icon: Store },
                { label: "Reviews", to: "/admin/reviews", icon: MessageSquare },
              ]}
            />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminHome />} />
        <Route path="reports" element={<FinancialReports />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="parts" element={<PartsManagement />} />
        <Route path="purchase-invoices" element={<PurchaseInvoices />} />
        <Route path="vendors" element={<VendorManagement />} />
        <Route path="reviews" element={<ReviewsManagement />} />
      </Route>

      {/* Staff portal */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={["Staff"]}>
            <PortalLayout
              roleLabel="Staff Portal"
              accentColor="#85B7EB"
              pillClass="bg-[#378ADD]/15 text-[#85B7EB] border border-[#378ADD]/30"
              navItems={[
                { label: "Dashboard", to: "/staff", icon: LayoutDashboard },
                { label: "Register Customer", to: "/staff/register-customer", icon: Users },
                { label: "All Customers", to: "/staff/customers", icon: FileText },
                { label: "Customer Search", to: "/staff/customer-search", icon: Search },
                { label: "Sales Invoices", to: "/staff/sales-invoices", icon: ShoppingCart },
                { label: "Appointments", to: "/staff/appointments", icon: Calendar },
                { label: "Part Requests", to: "/staff/part-requests", icon: Package },
                { label: "Reviews", to: "/staff/reviews", icon: MessageSquare },
                { label: "Customer Reports", to: "/staff/customer-reports", icon: BarChart2 },
              ]}
            />
          </ProtectedRoute>
        }
      >
        <Route index element={<StaffHome />} />
        <Route path="register-customer" element={<RegisterCustomer />} />
        <Route path="customers" element={<AllCustomers />} />
        <Route path="customer-search" element={<CustomerSearch />} />
        <Route path="sales-invoices" element={<SalesInvoices />} />
        <Route path="appointments" element={<StaffAppointments />} />
        <Route path="part-requests" element={<StaffPartRequests />} />
        <Route path="reviews" element={<ReviewsManagement />} />
        <Route path="customer-reports" element={<CustomerReports />} />
      </Route>

      {/* Customer portal */}
      <Route
        path="/customer"
        element={
          <ProtectedRoute allowedRoles={["Customer"]}>
            <PortalLayout
              roleLabel="Customer Portal"
              accentColor="#5DCAA5"
              pillClass="bg-[#1D9E75]/15 text-[#5DCAA5] border border-[#1D9E75]/30"
              navItems={[
                { label: "Dashboard", to: "/customer", icon: LayoutDashboard },
                { label: "My Profile", to: "/customer/profile", icon: UserCircle },
                { label: "Appointments", to: "/customer/appointments", icon: Calendar },
                { label: "Part Requests", to: "/customer/part-requests", icon: Inbox },
                { label: "Reviews", to: "/customer/reviews", icon: Star },
                { label: "My History", to: "/customer/history", icon: History },
              ]}
            />
          </ProtectedRoute>
        }
      >
        <Route index element={<CustomerHome />} />
        <Route path="profile" element={<CustomerProfile />} />
        <Route path="appointments" element={<CustomerAppointments />} />
        <Route path="part-requests" element={<CustomerPartRequests />} />
        <Route path="reviews" element={<CustomerReviews />} />
        <Route path="history" element={<CustomerHistory />} />
      </Route>

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
