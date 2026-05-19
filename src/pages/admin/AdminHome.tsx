import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch, fmtCurrency } from "../../utils/api";
import { PageHeader, PageWrapper, StatCard } from "../../components/shared/PortalLayout";
import { Spinner } from "../../components/shared/Feedback";
import {
  TrendingUp, Package, Users, ShoppingCart,
  Store, AlertCircle, Bell
} from "lucide-react";
import type { FinancialReportDto } from "../../types";

export default function AdminHome() {
  const { user } = useAuth();
  const [report, setReport] = useState<FinancialReportDto | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  useEffect(() => {
    apiFetch(`/financialreport/monthly?year=${year}&month=${month}`, user?.token)
      .then((r) => r.json())
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.token, year, month]);

  const triggerLowStock = async () => {
    await apiFetch("/alert/low-stock", user?.token, { method: "POST" });
    alert("Low-stock alert emails sent!");
  };

  const triggerOverdue = async () => {
    await apiFetch("/alert/overdue-reminders", user?.token, { method: "POST" });
    alert("Overdue payment reminder emails sent!");
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Admin Dashboard"
        subtitle={`Welcome back, ${user?.name}. Here's your overview for ${today.toLocaleString("default", { month: "long" })} ${year}.`}
      />

      {loading ? (
        <Spinner />
      ) : report ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Sales Revenue" value={fmtCurrency(report.totalSalesRevenue)} icon={TrendingUp} accent="#C97B4A" />
            <StatCard label="Net Profit" value={fmtCurrency(report.netProfit)} icon={TrendingUp} accent={report.netProfit >= 0 ? "#1D9E75" : "#E24B4A"} />
            <StatCard label="Sales Invoices" value={report.totalSalesInvoices} icon={ShoppingCart} accent="#C97B4A" />
            <StatCard label="Purchase Invoices" value={report.totalPurchaseInvoices} icon={Package} accent="#C97B4A" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Paid Invoices" value={report.paidSalesInvoices} icon={TrendingUp} accent="#1D9E75" />
            <StatCard label="Unpaid Invoices" value={report.unpaidSalesInvoices} icon={AlertCircle} accent="#E24B4A" />
            <StatCard label="Total Cost" value={fmtCurrency(report.totalPurchaseCost)} icon={Store} accent="#9A9490" />
            <StatCard label="Discounts Given" value={fmtCurrency(report.totalDiscountsGiven)} icon={Users} accent="#EF9F27" />
          </div>
        </>
      ) : (
        <p className="text-[#9A9490] text-sm">No financial data available.</p>
      )}

      {/* Alert controls */}
      <div className="bg-[#1A1815] border border-[#3A3530] rounded-xl p-6">
        <h2 className="font-[Syne] font-bold text-[#EDEAE4] mb-1">System Alerts</h2>
        <p className="text-sm text-[#9A9490] mb-5 font-[DM_Sans]">
          Alerts run automatically in the background. Trigger manually if needed.
        </p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={triggerLowStock}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#EF9F27]/10 hover:bg-[#EF9F27]/20 border border-[#EF9F27]/30 text-[#EF9F27] font-[Syne] text-sm rounded-lg transition-colors"
          >
            <Bell size={14} />
            Trigger Low-Stock Alert
          </button>
          <button
            onClick={triggerOverdue}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#E24B4A]/10 hover:bg-[#E24B4A]/20 border border-[#E24B4A]/30 text-[#F09595] font-[Syne] text-sm rounded-lg transition-colors"
          >
            <AlertCircle size={14} />
            Trigger Overdue Reminders
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}
