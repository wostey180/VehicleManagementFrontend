import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import logo from "../../assets/reviio-logo.png";
import type { LucideIcon } from "lucide-react";
import { LogOut, ChevronRight } from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

interface PortalLayoutProps {
  navItems: NavItem[];
  accentColor: string;
  pillClass: string;
  roleLabel: string;
}

export function PortalLayout({ navItems, accentColor, pillClass, roleLabel }: PortalLayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#0C0B0A] flex">
      {/* Sidebar */}
      <aside className="w-60 bg-[#1A1815] border-r border-[#3A3530] flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#3A3530]">
          <img src={logo} alt="Reviio" className="h-7 w-auto" />
          <span className={`mt-3 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-[Syne] font-bold tracking-widest uppercase ${pillClass}`}>
            {roleLabel}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.endsWith("/home")}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 mx-2 rounded-lg text-sm font-[DM_Sans] transition-all group ${
                  isActive
                    ? `bg-[${accentColor}]/10 text-[${accentColor}]`
                    : "text-[#9A9490] hover:text-[#EDEAE4] hover:bg-[#3A3530]/30"
                }`
              }
              style={({ isActive }) =>
                isActive ? { color: accentColor, background: `${accentColor}18` } : {}
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={16}
                    style={isActive ? { color: accentColor } : {}}
                    className={isActive ? "" : "text-[#9A9490] group-hover:text-[#EDEAE4]"}
                  />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight size={12} style={{ color: accentColor }} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-5 py-4 border-t border-[#3A3530]">
          <p className="text-xs text-[#EDEAE4] font-[DM_Sans] font-medium truncate">{user?.name}</p>
          <p className="text-[11px] text-[#9A9490] font-[DM_Sans] truncate mt-0.5">{user?.email}</p>
          <button
            onClick={logout}
            className="mt-3 flex items-center gap-2 text-xs text-[#9A9490] hover:text-[#F09595] transition-colors font-[DM_Sans]"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

// Page header reused across all pages
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="font-[Syne] font-extrabold text-2xl text-[#EDEAE4]">{title}</h1>
        {subtitle && <p className="text-sm text-[#9A9490] mt-1 font-[DM_Sans]">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return <div className="p-8">{children}</div>;
}

// Stat card for dashboard home pages
export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <div className="bg-[#1A1815] border border-[#3A3530] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-[Syne] font-semibold text-[#9A9490] uppercase tracking-wider">{label}</span>
        <div className="p-2 rounded-lg" style={{ background: `${accent}18` }}>
          <Icon size={15} style={{ color: accent }} />
        </div>
      </div>
      <p className="font-[Syne] font-extrabold text-2xl text-[#EDEAE4]">{value}</p>
    </div>
  );
}

// Simple data table wrapper
export function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#1A1815] border border-[#3A3530] rounded-xl overflow-hidden">
      <table className="w-full text-sm font-[DM_Sans]">{children}</table>
    </div>
  );
}

export function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={`px-5 py-3.5 text-[11px] font-[Syne] font-semibold text-[#9A9490] uppercase tracking-wider border-b border-[#3A3530] ${
        right ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

export function Td({ children, right, muted }: { children: React.ReactNode; right?: boolean; muted?: boolean }) {
  return (
    <td
      className={`px-5 py-4 border-b border-[#3A3530]/50 ${right ? "text-right" : ""} ${
        muted ? "text-[#9A9490]" : "text-[#EDEAE4]"
      }`}
    >
      {children}
    </td>
  );
}

export function TrHover({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors hover:bg-[#3A3530]/20 ${onClick ? "cursor-pointer" : ""}`}
    >
      {children}
    </tr>
  );
}
