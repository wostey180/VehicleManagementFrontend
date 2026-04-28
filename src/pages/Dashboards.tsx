import { useAuth } from "../hooks/useAuth";
import logo from "../assets/reviio-logo.png";

interface DashboardShellProps {
  pillClass: string;
  label: string;
  title: string;
  description: string;
}

function DashboardShell({ pillClass, label, title, description }: DashboardShellProps) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#0C0B0A] flex flex-col">
      <nav className="bg-[#1A1815] border-b border-[#3A3530] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Reviio" className="h-8 w-auto" />
          <span className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase ${pillClass}`}>
            {label}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#9A9490]">{user?.name}</span>
          <button
            onClick={logout}
            className="px-4 py-1.5 border border-[#3A3530] text-[#9A9490] hover:border-[#9A9490] hover:text-[#EDEAE4] rounded-md text-sm transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-8 py-16 text-center">
        <div>
          <h1 className="font-[Syne] font-extrabold text-6xl tracking-tight text-[#EDEAE4] mb-4">
            {title}{" "}
            <span className="text-[#C97B4A]">Dashboard</span>
          </h1>
          <p className="text-[#9A9490] text-base leading-relaxed max-w-lg mx-auto">
            {description}
          </p>
          <span className="inline-block mt-8 px-5 py-2 border border-[#3A3530] rounded-full text-xs text-[#9A9490] tracking-widest uppercase">
            Full UI coming soon
          </span>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  return (
    <DashboardShell
      pillClass="bg-[#C97B4A]/15 text-[#C97B4A] border border-[#C97B4A]/30"
      label="Admin Portal"
      title="Admin"
      description="Manage staff, vendors, parts inventory, purchase invoices, and view financial reports across the entire operation."
    />
  );
}

export function StaffDashboard() {
  return (
    <DashboardShell
      pillClass="bg-[#378ADD]/15 text-[#85B7EB] border border-[#378ADD]/30"
      label="Staff Portal"
      title="Staff"
      description="Register customers, create sales invoices, manage appointments, and view customer purchase history and vehicle details."
    />
  );
}

export function CustomerDashboard() {
  return (
    <DashboardShell
      pillClass="bg-[#1D9E75]/15 text-[#5DCAA5] border border-[#1D9E75]/30"
      label="Customer Portal"
      title="Customer"
      description="View your purchase history, book service appointments, request unavailable parts, and manage your vehicle profiles."
    />
  );
}