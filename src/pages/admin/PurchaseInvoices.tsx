import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch, fmtCurrency, fmtDate } from "../../utils/api";
import { PageHeader, PageWrapper, DataTable, Th, Td, TrHover } from "../../components/shared/PortalLayout";
import { Modal } from "../../components/shared/Modal";
import { Spinner, EmptyState, ErrorMsg, SuccessMsg } from "../../components/shared/Feedback";
import { inputClass, selectClass, labelClass, primaryBtn, secondaryBtn } from "../../components/shared/formStyles";
import type { PurchaseInvoiceResponse, VendorDto, PartDto } from "../../types";
import { Plus, Eye, X } from "lucide-react";

interface LineItem { partId: string; quantity: number; unitPrice: number; }

export default function PurchaseInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<PurchaseInvoiceResponse[]>([]);
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [parts, setParts] = useState<PartDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<PurchaseInvoiceResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [vendorId, setVendorId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ partId: "", quantity: 1, unitPrice: 0 }]);

  const load = async () => {
    setLoading(true);
    try {
      const [ir, vr, pr] = await Promise.all([
        apiFetch("/purchaseinvoice", user?.token),
        apiFetch("/vendor", user?.token),
        apiFetch("/part", user?.token),
      ]);
      setInvoices(await ir.json());
      setVendors(await vr.json());
      setParts(await pr.json());
    } catch { setError("Failed to load."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.token]);

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const handleCreate = async () => {
    if (!vendorId) { setError("Select a vendor."); return; }
    setSubmitting(true);
    try {
      const adminId = parseInt(localStorage.getItem("reviio_userId") || "0", 10);
      const body = {
        vendorId: parseInt(vendorId, 10),
        adminId,
        notes,
        items: items.map((it) => ({
          partId: parseInt(it.partId, 10),
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
      };
      const r = await apiFetch("/purchaseinvoice", user?.token, { method: "POST", body: JSON.stringify(body) });
      if (!r.ok) throw new Error("Failed to create invoice");
      flash("Purchase invoice created. Stock updated."); setCreateOpen(false);
      setVendorId(""); setNotes(""); setItems([{ partId: "", quantity: 1, unitPrice: 0 }]);
      load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSubmitting(false); }
  };

  const addItem = () => setItems([...items, { partId: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof LineItem, val: string) =>
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: field === "partId" ? val : Number(val) } : item));

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  return (
    <PageWrapper>
      <PageHeader
        title="Purchase Invoices"
        subtitle="Record stock purchases from vendors."
        action={
          <button onClick={() => setCreateOpen(true)} className={primaryBtn + " flex items-center gap-2"}>
            <Plus size={14} /> New Invoice
          </button>
        }
      />

      {error && <div className="mb-4"><ErrorMsg message={error} /></div>}
      {success && <div className="mb-4"><SuccessMsg message={success} /></div>}

      {loading ? <Spinner /> : invoices.length === 0 ? <EmptyState message="No purchase invoices yet." /> : (
        <DataTable>
          <thead>
            <tr>
              <Th>Date</Th><Th>Vendor</Th><Th>Admin</Th><Th>Notes</Th><Th right>Total</Th><Th right>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <TrHover key={inv.id}>
                <Td muted>{fmtDate(inv.invoiceDate)}</Td>
                <Td><span className="font-medium">{inv.vendorName}</span></Td>
                <Td muted>{inv.adminName}</Td>
                <Td muted>{inv.notes || "—"}</Td>
                <Td right>{fmtCurrency(inv.totalAmount)}</Td>
                <Td right>
                  <button onClick={() => setViewTarget(inv)} className="p-1.5 text-[#9A9490] hover:text-[#EDEAE4] transition-colors"><Eye size={14} /></button>
                </Td>
              </TrHover>
            ))}
          </tbody>
        </DataTable>
      )}

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Purchase Invoice" width="max-w-2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Vendor</label>
              <select className={selectClass} value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
                <option value="">Select vendor…</option>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <input type="text" className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass}>Line Items</label>
              <button onClick={addItem} className="text-xs text-[#C97B4A] hover:text-[#A85E30] font-[Syne] flex items-center gap-1">
                <Plus size={12} /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-center">
                  <select className={selectClass} value={item.partId} onChange={(e) => updateItem(i, "partId", e.target.value)}>
                    <option value="">Select part…</option>
                    {parts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input type="number" min={1} className={inputClass} value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} placeholder="Qty" />
                  <input type="number" min={0} step={0.01} className={inputClass} value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", e.target.value)} placeholder="Unit Price" />
                  <button onClick={() => removeItem(i)} className="text-[#9A9490] hover:text-[#F09595]"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-[#3A3530]">
            <span className="text-sm text-[#9A9490] font-[DM_Sans]">Total</span>
            <span className="font-[Syne] font-bold text-[#C97B4A] text-lg">{fmtCurrency(total)}</span>
          </div>

          <div className="flex gap-3">
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
              <div><p className="text-[#9A9490] text-xs mb-1 font-[Syne] font-semibold uppercase tracking-wider">Vendor</p><p className="text-[#EDEAE4]">{viewTarget.vendorName}</p></div>
              <div><p className="text-[#9A9490] text-xs mb-1 font-[Syne] font-semibold uppercase tracking-wider">Date</p><p className="text-[#EDEAE4]">{fmtDate(viewTarget.invoiceDate)}</p></div>
              <div><p className="text-[#9A9490] text-xs mb-1 font-[Syne] font-semibold uppercase tracking-wider">Admin</p><p className="text-[#EDEAE4]">{viewTarget.adminName}</p></div>
              <div><p className="text-[#9A9490] text-xs mb-1 font-[Syne] font-semibold uppercase tracking-wider">Total</p><p className="text-[#C97B4A] font-bold font-[Syne]">{fmtCurrency(viewTarget.totalAmount)}</p></div>
            </div>
            {viewTarget.notes && <p className="text-sm text-[#9A9490] font-[DM_Sans]">Notes: {viewTarget.notes}</p>}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#3A3530]">
                  <th className="text-left text-xs text-[#9A9490] py-2 font-[Syne] uppercase tracking-wider">Part</th>
                  <th className="text-right text-xs text-[#9A9490] py-2 font-[Syne] uppercase tracking-wider">Qty</th>
                  <th className="text-right text-xs text-[#9A9490] py-2 font-[Syne] uppercase tracking-wider">Unit</th>
                  <th className="text-right text-xs text-[#9A9490] py-2 font-[Syne] uppercase tracking-wider">Subtotal</th>
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
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
