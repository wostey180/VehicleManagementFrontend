import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch, fmtCurrency, fmtDate } from "../../utils/api";
import { PageHeader, PageWrapper } from "../../components/shared/PortalLayout";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { Spinner, EmptyState, ErrorMsg } from "../../components/shared/Feedback";
import type { CustomerHistoryDto } from "../../types";
import { ShoppingCart, Wrench, ChevronDown, ChevronUp } from "lucide-react";

function useCustomerId() {
  return localStorage.getItem("reviio_customerId") || "";
}

export default function CustomerHistory() {
  const { user } = useAuth();
  const customerId = useCustomerId();
  const [history, setHistory] = useState<CustomerHistoryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"purchases" | "services">("purchases");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) { setLoading(false); return; }
    apiFetch(`/customerhistory/${customerId}`, user?.token)
      .then((r) => r.json())
      .then(setHistory)
      .catch(() => setError("Failed to load history."))
      .finally(() => setLoading(false));
  }, [customerId, user?.token]);

  return (
    <PageWrapper>
      <PageHeader title="My History" subtitle="View all your purchases and service appointments." />

      {error && <ErrorMsg message={error} />}

      {history && (
        <div className="flex items-center gap-6 mb-6">
          <div>
            <p className="text-xs text-[#9A9490] font-[Syne] font-semibold uppercase tracking-wider mb-1">Total Spent</p>
            <p className="font-[Syne] font-extrabold text-2xl text-[#C97B4A]">{fmtCurrency(history.totalSpent)}</p>
          </div>
          <div className="w-px h-10 bg-[#3A3530]" />
          <div>
            <p className="text-xs text-[#9A9490] font-[Syne] font-semibold uppercase tracking-wider mb-1">Loyalty Points</p>
            <p className="font-[Syne] font-extrabold text-2xl text-[#EF9F27]">{history.loyaltyPoints}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "purchases" as const, label: "Purchase History", icon: ShoppingCart },
          { key: "services" as const, label: "Service History", icon: Wrench },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-[Syne] transition-colors ${
              tab === key ? "bg-[#C97B4A] text-[#0C0B0A] font-bold" : "border border-[#3A3530] text-[#9A9490] hover:text-[#EDEAE4]"
            }`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : !history ? null : tab === "purchases" ? (
        history.purchaseHistory.length === 0 ? <EmptyState message="No purchase history yet." /> : (
          <div className="space-y-3">
            {history.purchaseHistory.map((inv) => (
              <div key={inv.invoiceId} className="bg-[#1A1815] border border-[#3A3530] rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === inv.invoiceId ? null : inv.invoiceId)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#3A3530]/20 transition-colors"
                >
                  <div className="flex items-center gap-6 text-left">
                    <div>
                      <p className="text-xs text-[#9A9490] font-[Syne] uppercase tracking-wider mb-0.5">Date</p>
                      <p className="text-sm text-[#EDEAE4] font-[DM_Sans]">{fmtDate(inv.invoiceDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9A9490] font-[Syne] uppercase tracking-wider mb-0.5">Total</p>
                      <p className="text-sm font-[Syne] font-bold text-[#C97B4A]">{fmtCurrency(inv.totalAmount)}</p>
                    </div>
                    {inv.discountApplied > 0 && (
                      <div>
                        <p className="text-xs text-[#9A9490] font-[Syne] uppercase tracking-wider mb-0.5">Saved</p>
                        <p className="text-sm text-[#EF9F27] font-[Syne] font-bold">{fmtCurrency(inv.discountApplied)}</p>
                      </div>
                    )}
                    <StatusBadge status={inv.isPaid ? "Paid" : "Unpaid"} />
                  </div>
                  {expanded === inv.invoiceId ? <ChevronUp size={16} className="text-[#9A9490]" /> : <ChevronDown size={16} className="text-[#9A9490]" />}
                </button>

                {expanded === inv.invoiceId && (
                  <div className="px-5 pb-4 border-t border-[#3A3530]/50">
                    <table className="w-full text-sm mt-3">
                      <thead>
                        <tr>
                          {["Part", "Qty", "Unit Price", "Subtotal"].map((h) => (
                            <th key={h} className={`py-2 text-xs text-[#9A9490] font-[Syne] uppercase tracking-wider ${h === "Part" ? "text-left" : "text-right"}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {inv.parts.map((p, i) => (
                          <tr key={i} className="border-t border-[#3A3530]/30">
                            <td className="py-2.5 text-[#EDEAE4] font-[DM_Sans]">{p.partName}</td>
                            <td className="py-2.5 text-right text-[#9A9490]">{p.quantity}</td>
                            <td className="py-2.5 text-right text-[#9A9490]">{fmtCurrency(p.unitPrice)}</td>
                            <td className="py-2.5 text-right text-[#EDEAE4]">{fmtCurrency(p.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!inv.isPaid && inv.paymentDueDate && (
                      <p className="text-xs text-[#F09595] mt-3 font-[DM_Sans]">Payment due: {fmtDate(inv.paymentDueDate)}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        history.serviceHistory.length === 0 ? <EmptyState message="No service history yet." /> : (
          <div className="space-y-3">
            {history.serviceHistory.map((s) => (
              <div key={s.appointmentId} className="bg-[#1A1815] border border-[#3A3530] rounded-xl p-5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-sm font-medium text-[#EDEAE4] font-[DM_Sans]">
                      {s.vehicleYear} {s.vehicleMake} {s.vehicleModel}
                    </p>
                    <span className="text-xs text-[#9A9490]">{s.licensePlate}</span>
                  </div>
                  <p className="text-xs text-[#9A9490] font-[DM_Sans] mb-2">{fmtDate(s.appointmentDate)}</p>
                  {s.notes && <p className="text-sm text-[#9A9490] font-[DM_Sans]">{s.notes}</p>}
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        )
      )}
    </PageWrapper>
  );
}
