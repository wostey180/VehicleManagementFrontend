import { useAuth } from "../../hooks/useAuth";
import { PageHeader, PageWrapper } from "../../components/shared/PortalLayout";
import { Users, ShoppingCart, Search, FileText, BarChart2, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

const shortcuts = [
  { label: "Register Customer", desc: "Add new customer with vehicle", icon: Users, to: "/staff/register-customer", color: "#378ADD" },
  { label: "Search Customers", desc: "Find by name, phone, plate, ID", icon: Search, to: "/staff/customer-search", color: "#378ADD" },
  { label: "Create Sales Invoice", desc: "Sell parts & generate invoice", icon: ShoppingCart, to: "/staff/sales-invoices", color: "#1D9E75" },
  { label: "Customer Reports", desc: "Top spenders, regulars, credits", icon: BarChart2, to: "/staff/customer-reports", color: "#C97B4A" },
  { label: "All Customers", desc: "View all customer details", icon: FileText, to: "/staff/customers", color: "#378ADD" },
  { label: "Appointments", desc: "Manage service appointments", icon: Calendar, to: "/staff/appointments", color: "#EF9F27" },
];

export default function StaffHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <PageWrapper>
      <PageHeader
        title="Staff Dashboard"
        subtitle={`Welcome, ${user?.name}. What would you like to do today?`}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {shortcuts.map((s) => (
          <button
            key={s.to}
            onClick={() => navigate(s.to)}
            className="text-left bg-[#1A1815] border border-[#3A3530] hover:border-[#3A3530]/70 rounded-xl p-5 transition-all hover:bg-[#1A1815]/80 group"
          >
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg shrink-0" style={{ background: `${s.color}18` }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <div>
                <p className="font-[Syne] font-bold text-[#EDEAE4] text-sm mb-1 group-hover:text-white">{s.label}</p>
                <p className="text-xs text-[#9A9490] font-[DM_Sans]">{s.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </PageWrapper>
  );
}
