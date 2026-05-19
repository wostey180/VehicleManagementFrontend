import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch, fmtCurrency } from "../../utils/api";
import { PageHeader, PageWrapper, StatCard } from "../../components/shared/PortalLayout";
import { ShoppingCart, Star, Calendar, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { CustomerResponse } from "../../types";

const shortcuts = [
  { label: "Book Appointment", to: "/customer/appointments", icon: Calendar, color: "#EF9F27" },
  { label: "Request a Part", to: "/customer/part-requests", icon: Package, color: "#378ADD" },
  { label: "My Invoices", to: "/customer/history", icon: ShoppingCart, color: "#1D9E75" },
  { label: "Write a Review", to: "/customer/reviews", icon: Star, color: "#C97B4A" },
];

export default function CustomerHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CustomerResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Need to find customerId from backend — use profile endpoint after fetching from auth
  useEffect(() => {
    // Fetch profile by email — no direct customerId in JWT, load from /customer endpoint
    // For now fetch all customers and match, or use dedicated endpoint
    const fetchProfile = async () => {
      try {
        // Try to get customerId stored at login
        const cid = localStorage.getItem("reviio_customerId");
        if (cid) {
          const r = await apiFetch(`/customer/${cid}/profile`, user?.token);
          if (r.ok) { setProfile(await r.json()); }
        }
      } catch {}
      finally { setLoading(false); }
    };
    fetchProfile();
  }, [user?.token]);

  return (
    <PageWrapper>
      <PageHeader
        title="My Dashboard"
        subtitle={`Welcome back, ${user?.name}.`}
      />

      {!loading && profile && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Spent" value={fmtCurrency(profile.totalSpent)} icon={ShoppingCart} accent="#1D9E75" />
          <StatCard label="Loyalty Points" value={profile.loyaltyPoints} icon={Star} accent="#EF9F27" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {shortcuts.map((s) => (
          <button
            key={s.to}
            onClick={() => navigate(s.to)}
            className="text-left bg-[#1A1815] border border-[#3A3530] hover:border-[#3A3530]/70 rounded-xl p-5 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg shrink-0" style={{ background: `${s.color}18` }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <div>
                <p className="font-[Syne] font-bold text-[#EDEAE4] text-sm mb-1 group-hover:text-white">{s.label}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </PageWrapper>
  );
}
