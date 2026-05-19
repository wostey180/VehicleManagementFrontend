import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch, fmtCurrency, fmtDate } from "../../utils/api";
import { PageHeader, PageWrapper, DataTable, Th, Td, TrHover } from "../../components/shared/PortalLayout";
import { Modal } from "../../components/shared/Modal";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { Spinner, EmptyState, ErrorMsg, SuccessMsg } from "../../components/shared/Feedback";
import { SearchableSelect } from "../../components/shared/SearchableSelect";
import { inputClass, selectClass, labelClass, primaryBtn, secondaryBtn } from "../../components/shared/formStyles";
import type { SalesInvoiceResponse, PartDto, CustomerDetailDto } from "../../types";
import { Plus, Eye, Mail, Tag, X } from "lucide-react";

interface LineItem { partId: string; quantity: number; }

export default function SalesInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<SalesInvoiceResponse[]>([]);
const [customers, setCustomers] = useState<CustomerDetailDto[]>([]);
  const [parts, setParts] = useState<PartDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<SalesInvoiceResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [emailSending, setEmailSending] = useState<string | null>(null);

  // Create form
  const [customerId, setCustomerId] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [paymentDueDate, setPaymentDueDate] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ partId: "", quantity: 1 }]);
  const [loyaltyPreview, setLoyaltyPreview] = useState<{ isEligible: boolean; discountApplied: number; finalAmount: number; originalAmount: number } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [ir, cr, pr] = await Promise.all([
        apiFetch("/salesinvoice", user?.token),
        apiFetch("/staff/customers", user?.token),
        apiFetch("/part", user?.token),
      ]);
      setInvoices(await ir.json());
      setCustomers(await cr.json());
      setParts(await pr.json());
    } catch { setError("Failed to load."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.token]);

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const checkLoyalty = async () => {
    const total = items.reduce((s, i) => {
      const p = parts.find((p) => p.id === i.partId);
      return s + (p ? p.price * i.quantity : 0);
    }, 0);
    if (total === 0) return;
    try {
      const r = await apiFetch("/loyalty/check", user?.token, { method: "POST", body: JSON.stringify({ totalAmount: total }) });
      setLoyaltyPreview(await r.json());
    } catch {}
  };

  const handleCreate = async () => {
    setSubmitting(true);
    try {
const body = { 
  customerId: parseInt(customerId, 10),
  staffId: parseInt(localStorage.getItem("reviio_userId") || "0", 10),
  isPaid, 
  paymentDueDate: paymentDueDate || undefined, 
  items 
};      const r = await apiFetch("/salesinvoice", user?.token, { method: "POST", body: JSON.stringify(body) });
      if (!r.ok) throw new Error("Failed to create invoice");
      flash("Sales invoice created."); setCreateOpen(false);
      setCustomerId(""); setIsPaid(false); setPaymentDueDate(""); setItems([{ partId: "", quantity: 1 }]); setLoyaltyPreview(null);
      load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSubmitting(false); }
  };

  const sendEmail = async (id: string) => {
    setEmailSending(id);
    try {
      const r = await apiFetch(`/salesinvoice/${id}/send-email`, user?.token, { method: "POST" });
      if (!r.ok) throw new Error("Failed to send email");
      flash("Invoice emailed to customer."); load();
    } catch { setError("Failed to send email."); }
    finally { setEmailSending(null); }
  };

  const markAsPaid = async (id: string) => {
  try {
    const r = await apiFetch(`/salesinvoice/${id}/mark-paid`, user?.token, { method: "PATCH" });
    if (!r.ok) throw new Error();
    flash("Invoice marked as paid.");
    load();
  } catch { setError("Failed to mark invoice as paid."); }
};

  const addItem = () => setItems([...items, { partId: "", quantity: 1 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof LineItem, val: string) =>
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: field === "partId" ? val : Number(val) } : item));

  return (
    <PageWrapper>
      <PageHeader
        title="Sales Invoices"
        subtitle="Create and manage customer sales invoices."
        action={
          <button onClick={() => setCreateOpen(true)} className={primaryBtn + " flex items-center gap-2"}>
            <Plus size={14} /> New Invoice
          </button>
        }
      />

      {error && <div className="mb-4"><ErrorMsg message={error} /></div>}
      {success && <div className="mb-4"><SuccessMsg message={success} /></div>}

      {loading ? <Spinner /> : invoices.length === 0 ? <EmptyState message="No sales invoices yet." /> : (
        <DataTable>
          <thead>
            <tr>
              <Th>Date</Th><Th>Customer</Th><Th>Original</Th><Th>Discount</Th><Th>Total</Th><Th>Status</Th><Th>Email</Th><Th right>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <TrHover key={inv.id}>
                <Td muted>{fmtDate(inv.invoiceDate)}</Td>
                <Td><span className="font-medium">{inv.customerName}</span></Td>
                <Td muted>{fmtCurrency(inv.originalAmount)}</Td>
                <Td>
                  {inv.discountApplied > 0
                    ? <span className="text-[#EF9F27] font-medium">-{fmtCurrency(inv.discountApplied)}</span>
                    : <span className="text-[#9A9490]">—</span>}
                </Td>
                <Td>{fmtCurrency(inv.totalAmount)}</Td>
<Td>
  <div className="flex items-center gap-2">
    <StatusBadge status={inv.isPaid ? "Paid" : "Unpaid"} />
    {!inv.isPaid && (
      <button
        onClick={() => markAsPaid(inv.id)}
        className="text-xs px-2 py-1 bg-[#1D9E75]/10 hover:bg-[#1D9E75]/20 border border-[#1D9E75]/30 text-[#5DCAA5] rounded font-[Syne] transition-colors"
      >
        Mark Paid
      </button>
    )}
  </div>
</Td>                <Td>
                  {inv.emailSent
                    ? <span className="text-xs text-[#5DCAA5]">Sent</span>
                    : <button
                        onClick={() => sendEmail(inv.id)}
                        disabled={emailSending === inv.id}
                        className="text-xs text-[#9A9490] hover:text-[#85B7EB] flex items-center gap-1 transition-colors"
                      >
                        <Mail size={12} /> {emailSending === inv.id ? "Sending…" : "Send"}
                      </button>}
                </Td>
                <Td right>
                  <button onClick={() => setViewTarget(inv)} className="p-1.5 text-[#9A9490] hover:text-[#EDEAE4] transition-colors"><Eye size={14} /></button>
                </Td>
              </TrHover>
            ))}
          </tbody>
        </DataTable>
      )}

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Sales Invoice" width="max-w-2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Customer</label>
              <SearchableSelect
                options={customers.map((c) => ({
                  value: c.customerId,
                  label: c.fullName,
                  sublabel: c.email,
                }))}
                value={customerId}
                onChange={setCustomerId}
                placeholder="Search customer…"
              />
            </div>
            <div>
              <label className={labelClass}>Payment Status</label>
              <select className={selectClass} value={isPaid ? "paid" : "unpaid"} onChange={(e) => setIsPaid(e.target.value === "paid")}>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            {!isPaid && (
              <div>
                <label className={labelClass}>Payment Due Date</label>
                <input type="date" className={inputClass} value={paymentDueDate} onChange={(e) => setPaymentDueDate(e.target.value)} />
              </div>
            )}
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass}>Parts</label>
              <button onClick={addItem} className="text-xs text-[#85B7EB] hover:text-[#378ADD] font-[Syne] flex items-center gap-1">
                <Plus size={12} /> Add Part
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => {
                const part = parts.find((p) => p.id === item.partId);
                return (
                  <div key={i} className="grid grid-cols-[1fr_80px_80px_32px] gap-2 items-center">
                    <select className={selectClass} value={item.partId} onChange={(e) => updateItem(i, "partId", e.target.value)}>
                      <option value="">Select part…</option>
                      {parts.map((p) => <option key={p.id} value={p.id}>{p.name} ({fmtCurrency(p.price)}) — Stock: {p.stockQuantity}</option>)}
                    </select>
                    <input type="number" min={1} className={inputClass} value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} placeholder="Qty" />
                    <span className="text-sm text-[#9A9490] font-[DM_Sans] text-right">
                      {part ? fmtCurrency(part.price * item.quantity) : "—"}
                    </span>
                    <button onClick={() => removeItem(i)} className="text-[#9A9490] hover:text-[#F09595]"><X size={14} /></button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Loyalty check */}
          <div className="flex gap-2 items-center">
            <button onClick={checkLoyalty} className="flex items-center gap-2 px-4 py-2 border border-[#EF9F27]/30 text-[#EF9F27] hover:bg-[#EF9F27]/10 rounded-lg text-sm font-[Syne] transition-colors">
              <Tag size={14} /> Check Loyalty Discount
            </button>
            {loyaltyPreview && (
              <div className={`text-sm font-[DM_Sans] ${loyaltyPreview.isEligible ? "text-[#5DCAA5]" : "text-[#9A9490]"}`}>
                {loyaltyPreview.isEligible
                  ? `10% discount applies! You save ${fmtCurrency(loyaltyPreview.discountApplied)} → Final: ${fmtCurrency(loyaltyPreview.finalAmount)}`
                  : `Total ${fmtCurrency(loyaltyPreview.originalAmount)} — not eligible (must be > $5,000)`}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleCreate} disabled={submitting} className={primaryBtn}>{submitting ? "Creating…" : "Create Invoice"}</button>
            <button onClick={() => setCreateOpen(false)} className={secondaryBtn}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Invoice Details" width="max-w-xl">
        {viewTarget && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Customer", val: viewTarget.customerName },
                { label: "Date", val: fmtDate(viewTarget.invoiceDate) },
                { label: "Staff", val: viewTarget.staffName },
                { label: "Status", val: viewTarget.isPaid ? "Paid" : "Unpaid" },
                { label: "Original", val: fmtCurrency(viewTarget.originalAmount) },
                { label: "Discount", val: viewTarget.discountApplied > 0 ? fmtCurrency(viewTarget.discountApplied) : "None" },
                { label: "Total", val: fmtCurrency(viewTarget.totalAmount) },
                { label: "Email Sent", val: viewTarget.emailSent ? "Yes" : "No" },
              ].map(({ label, val }) => (
                <div key={label}>
                  <p className="text-[#9A9490] text-xs font-[Syne] font-semibold uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-[#EDEAE4]">{val}</p>
                </div>
              ))}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#3A3530]">
                  {["Part", "Qty", "Unit Price", "Subtotal"].map((h) => (
                    <th key={h} className={`py-2 text-xs text-[#9A9490] font-[Syne] uppercase tracking-wider ${h === "Part" ? "text-left" : "text-right"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {viewTarget.items.map((item) => (
                  <tr key={item.id} className="border-b border-[#3A3530]/50">
                    <td className="py-3 text-[#EDEAE4] font-[DM_Sans]">{item.partName}</td>
                    <td className="py-3 text-right text-[#9A9490]">{item.quantity}</td>
                    <td className="py-3 text-right text-[#9A9490]">{fmtCurrency(item.unitPrice)}</td>
                    <td className="py-3 text-right text-[#EDEAE4]">{fmtCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!viewTarget.emailSent && (
              <button onClick={() => { sendEmail(viewTarget.id); setViewTarget(null); }}
                className="flex items-center gap-2 px-4 py-2 border border-[#378ADD]/30 text-[#85B7EB] hover:bg-[#378ADD]/10 rounded-lg text-sm font-[Syne] transition-colors">
                <Mail size={14} /> Send Invoice to Customer
              </button>
            )}
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
