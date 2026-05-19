import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch, fmtCurrency, fmtDate } from "../../utils/api";
import { PageHeader, PageWrapper, DataTable, Th, Td, TrHover } from "../../components/shared/PortalLayout";
import { Spinner, ErrorMsg } from "../../components/shared/Feedback";
import type { FinancialReportDto } from "../../types";

type Period = "daily" | "monthly" | "yearly";

export default function FinancialReports() {
  const { user } = useAuth();
  const today = new Date();
  const [period, setPeriod] = useState<Period>("monthly");
  const [date, setDate] = useState(today.toISOString().slice(0, 10));
  const [year, setYear] = useState(String(today.getFullYear()));
  const [month, setMonth] = useState(String(today.getMonth() + 1).padStart(2, "0"));
  const [report, setReport] = useState<FinancialReportDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetch = async () => {
    setLoading(true);
    setError("");
    let url = "";
    if (period === "daily") url = `/financialreport/daily?date=${date}`;
    else if (period === "monthly") url = `/financialreport/monthly?year=${year}&month=${month}`;
    else url = `/financialreport/yearly?year=${year}`;

    try {
      const r = await apiFetch(url, user?.token);
      if (!r.ok) throw new Error("Failed to fetch report");
      setReport(await r.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error fetching report");
    } finally {
      setLoading(false);
    }
  };

  const tabs: Period[] = ["daily", "monthly", "yearly"];

  return (
    <PageWrapper>
      <PageHeader title="Financial Reports" subtitle="View daily, monthly, and yearly financial summaries." />

      {/* Controls */}
      <div className="bg-[#1A1815] border border-[#3A3530] rounded-xl p-5 mb-6">
        <div className="flex gap-2 mb-5">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => { setPeriod(t); setReport(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-[Syne] capitalize transition-colors ${
                period === t
                  ? "bg-[#C97B4A] text-[#0C0B0A] font-bold"
                  : "border border-[#3A3530] text-[#9A9490] hover:text-[#EDEAE4]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap items-end">
          {period === "daily" && (
            <div>
              <label className="block text-xs text-[#9A9490] mb-1 font-[Syne] font-semibold uppercase tracking-wider">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-[#0C0B0A] border border-[#3A3530] rounded-lg px-4 py-2.5 text-sm text-[#EDEAE4] outline-none focus:border-[#C97B4A]"
              />
            </div>
          )}
          {period !== "daily" && (
            <div>
              <label className="block text-xs text-[#9A9490] mb-1 font-[Syne] font-semibold uppercase tracking-wider">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="bg-[#0C0B0A] border border-[#3A3530] rounded-lg px-4 py-2.5 text-sm text-[#EDEAE4] outline-none focus:border-[#C97B4A] w-28"
              />
            </div>
          )}
          {period === "monthly" && (
            <div>
              <label className="block text-xs text-[#9A9490] mb-1 font-[Syne] font-semibold uppercase tracking-wider">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="bg-[#0C0B0A] border border-[#3A3530] rounded-lg px-4 py-2.5 text-sm text-[#EDEAE4] outline-none focus:border-[#C97B4A]"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                    {new Date(2000, i).toLocaleString("default", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={fetch}
            disabled={loading}
            className="px-5 py-2.5 bg-[#C97B4A] hover:bg-[#A85E30] text-[#0C0B0A] font-[Syne] font-bold text-sm rounded-lg transition-colors disabled:opacity-40"
          >
            {loading ? "Loading…" : "Generate Report"}
          </button>
        </div>
      </div>

      {error && <ErrorMsg message={error} />}
      {loading && <Spinner />}

      {report && !loading && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Sales Revenue", val: fmtCurrency(report.totalSalesRevenue), color: "#C97B4A" },
              { label: "Purchase Cost", val: fmtCurrency(report.totalPurchaseCost), color: "#9A9490" },
              { label: "Net Profit", val: fmtCurrency(report.netProfit), color: report.netProfit >= 0 ? "#1D9E75" : "#E24B4A" },
              { label: "Discounts Given", val: fmtCurrency(report.totalDiscountsGiven), color: "#EF9F27" },
            ].map((c) => (
              <div key={c.label} className="bg-[#1A1815] border border-[#3A3530] rounded-xl p-5">
                <p className="text-xs font-[Syne] font-semibold text-[#9A9490] uppercase tracking-wider mb-2">{c.label}</p>
                <p className="font-[Syne] font-extrabold text-xl" style={{ color: c.color }}>{c.val}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Sales Invoices", val: report.totalSalesInvoices },
              { label: "Paid", val: report.paidSalesInvoices },
              { label: "Unpaid", val: report.unpaidSalesInvoices },
              { label: "Purchase Invoices", val: report.totalPurchaseInvoices },
            ].map((c) => (
              <div key={c.label} className="bg-[#1A1815] border border-[#3A3530] rounded-xl p-5">
                <p className="text-xs font-[Syne] font-semibold text-[#9A9490] uppercase tracking-wider mb-2">{c.label}</p>
                <p className="font-[Syne] font-extrabold text-2xl text-[#EDEAE4]">{c.val}</p>
              </div>
            ))}
          </div>

          {/* Daily breakdown */}
          {report.dailyBreakdown?.length > 0 && (
            <>
              <h2 className="font-[Syne] font-bold text-[#EDEAE4] mb-4">Daily Breakdown</h2>
              <DataTable>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th right>Sales Revenue</Th>
                    <Th right>Purchase Cost</Th>
                    <Th right>Net</Th>
                  </tr>
                </thead>
                <tbody>
                  {report.dailyBreakdown.map((d) => (
                    <TrHover key={d.date}>
                      <Td>{fmtDate(d.date)}</Td>
                      <Td right>{fmtCurrency(d.salesRevenue)}</Td>
                      <Td right muted>{fmtCurrency(d.purchaseCost)}</Td>
                      <Td right>
                        <span style={{ color: d.salesRevenue - d.purchaseCost >= 0 ? "#5DCAA5" : "#F09595" }}>
                          {fmtCurrency(d.salesRevenue - d.purchaseCost)}
                        </span>
                      </Td>
                    </TrHover>
                  ))}
                </tbody>
              </DataTable>
            </>
          )}
        </>
      )}
    </PageWrapper>
  );
}
