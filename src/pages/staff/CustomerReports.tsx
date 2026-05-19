import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch, fmtCurrency, fmtDate } from "../../utils/api";
import { PageHeader, PageWrapper, DataTable, Th, Td, TrHover } from "../../components/shared/PortalLayout";
import { Spinner, EmptyState, ErrorMsg } from "../../components/shared/Feedback";
import type { TopSpender, RegularCustomer, PendingCredit } from "../../types";
import { Trophy, Repeat, AlertCircle } from "lucide-react";

type Tab = "top-spenders" | "regulars" | "pending";

export default function CustomerReports() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("top-spenders");
  const topN = "10";
  const [topSpenders, setTopSpenders] = useState<TopSpender[]>([]);
  const [regulars, setRegulars] = useState<RegularCustomer[]>([]);
  const [pending, setPending] = useState<PendingCredit[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  const loadTab = async (t: Tab) => {
    if (loaded[t]) return;
    setLoading(true); setError("");
    try {
      if (t === "top-spenders") {
        const r = await apiFetch(`/customerreport/top-spenders?topN=${topN}`, user?.token);
        setTopSpenders(await r.json());
      } else if (t === "regulars") {
        const r = await apiFetch(`/customerreport/regulars?topN=${topN}`, user?.token);
        setRegulars(await r.json());
      } else {
        const r = await apiFetch("/customerreport/pending-credits", user?.token);
        setPending(await r.json());
      }
      setLoaded({ ...loaded, [t]: true });
    } catch { setError("Failed to load report."); }
    finally { setLoading(false); }
  };

  const switchTab = (t: Tab) => { setTab(t); loadTab(t); };
  if (!loaded["top-spenders"] && !loading) loadTab("top-spenders");

  const tabs = [
    { key: "top-spenders" as Tab, label: "Top Spenders", icon: Trophy },
    { key: "regulars" as Tab, label: "Regulars", icon: Repeat },
    { key: "pending" as Tab, label: "Pending Credits", icon: AlertCircle },
  ];

  return (
    <PageWrapper>
      <PageHeader title="Customer Reports" subtitle="Analyse customer spending, frequency, and outstanding credits." />

      <div className="flex gap-2 mb-6">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-[Syne] transition-colors ${
              tab === key ? "bg-[#C97B4A] text-[#0C0B0A] font-bold" : "border border-[#3A3530] text-[#9A9490] hover:text-[#EDEAE4]"
            }`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {error && <ErrorMsg message={error} />}
      {loading && <Spinner />}

      {!loading && tab === "top-spenders" && (
        topSpenders.length === 0 ? <EmptyState message="No data." /> : (
          <DataTable>
            <thead>
              <tr><Th>#</Th><Th>Customer</Th><Th>Email</Th><Th right>Loyalty Pts</Th><Th right>Total Spent</Th></tr>
            </thead>
            <tbody>
              {topSpenders.map((c, i) => (
                <TrHover key={c.customerId}>
                  <Td>
                    <span className={`font-[Syne] font-bold ${i === 0 ? "text-[#EF9F27]" : i === 1 ? "text-[#9A9490]" : i === 2 ? "text-[#C97B4A]" : "text-[#9A9490]"}`}>
                      #{i + 1}
                    </span>
                  </Td>
                  <Td><span className="font-medium">{c.fullName}</span></Td>
                  <Td muted>{c.email}</Td>
                  <Td right><span className="text-[#EF9F27] font-[Syne] font-bold">{c.loyaltyPoints}</span></Td>
                  <Td right><span className="text-[#5DCAA5] font-[Syne] font-bold">{fmtCurrency(c.totalSpent)}</span></Td>
                </TrHover>
              ))}
            </tbody>
          </DataTable>
        )
      )}

      {!loading && tab === "regulars" && (
        regulars.length === 0 ? <EmptyState message="No data." /> : (
          <DataTable>
            <thead>
              <tr><Th>#</Th><Th>Customer</Th><Th>Email</Th><Th right>Purchases</Th><Th>Last Purchase</Th></tr>
            </thead>
            <tbody>
              {regulars.map((c, i) => (
                <TrHover key={c.customerId}>
                  <Td><span className="font-[Syne] font-bold text-[#9A9490]">#{i + 1}</span></Td>
                  <Td><span className="font-medium">{c.fullName}</span></Td>
                  <Td muted>{c.email}</Td>
                  <Td right><span className="text-[#85B7EB] font-[Syne] font-bold">{c.totalPurchases}</span></Td>
                  <Td muted>{c.lastPurchaseDate ? fmtDate(c.lastPurchaseDate) : "—"}</Td>
                </TrHover>
              ))}
            </tbody>
          </DataTable>
        )
      )}

      {!loading && tab === "pending" && (
        pending.length === 0 ? <EmptyState message="No pending credits." /> : (
          <DataTable>
            <thead>
              <tr><Th>Customer</Th><Th>Email</Th><Th>Phone</Th><Th>Invoice</Th><Th>Due Date</Th><Th right>Status</Th><Th right>Amount Due</Th></tr>
            </thead>
            <tbody>
              {pending.map((c) => {
                const isOverdue = c.daysOverdue > 0;
                const noDueDate = !c.paymentDueDate;
                return (
                  <TrHover key={c.invoiceId}>
                    <Td><span className="font-medium">{c.fullName}</span></Td>
                    <Td muted>{c.email}</Td>
                    <Td muted>{c.phone || "—"}</Td>
                    <Td muted>#{c.invoiceId}</Td>
                    <Td muted>{c.paymentDueDate ? fmtDate(c.paymentDueDate) : "—"}</Td>
                    <Td right>
                      {noDueDate ? (
                        <span className="text-[#9A9490] text-xs font-[DM_Sans]">No due date</span>
                      ) : isOverdue ? (
                        <span className="text-[#F09595] font-[Syne] font-bold text-sm">{c.daysOverdue}d overdue</span>
                      ) : (
                        <span className="text-[#5DCAA5] text-xs font-[DM_Sans]">Due in {Math.abs(c.daysOverdue)}d</span>
                      )}
                    </Td>
                    <Td right><span className="text-[#F09595] font-[Syne] font-bold">{fmtCurrency(c.amountDue)}</span></Td>
                  </TrHover>
                );
              })}
            </tbody>
          </DataTable>
        )
      )}
    </PageWrapper>
  );
}
