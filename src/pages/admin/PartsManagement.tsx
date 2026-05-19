import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch, fmtCurrency, fmtDate } from "../../utils/api";
import { PageHeader, PageWrapper } from "../../components/shared/PortalLayout";
import { Modal } from "../../components/shared/Modal";
import { Spinner, EmptyState, ErrorMsg, SuccessMsg } from "../../components/shared/Feedback";
import { inputClass, selectClass, labelClass, primaryBtn, secondaryBtn, dangerBtn } from "../../components/shared/formStyles";
import { ImageUpload } from "../../components/shared/ImageUpload";
import type { PartDto, VendorDto } from "../../types";
import { Plus, Pencil, Trash2, AlertCircle, Package, Search } from "lucide-react";

const PART_FIELDS: { label: string; key: string }[] = [
  { label: "Part Name", key: "name" },
  { label: "Description", key: "description" },
  { label: "Category", key: "category" },
  { label: "Price", key: "price" },
  { label: "Stock Quantity", key: "stockQuantity" },
];

export default function PartsManagement() {
  const { user } = useAuth();
  const [parts, setParts] = useState<PartDto[]>([]);
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PartDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PartDto | null>(null);
  const [viewTarget, setViewTarget] = useState<PartDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [partImages, setPartImages] = useState<Record<string, string>>({});
  // Temp image URL while in the create/edit modal (committed on save)
  const [pendingImageUrl, setPendingImageUrl] = useState("");

  const emptyForm = { name: "", description: "", category: "", price: "", stockQuantity: "", vendorId: "" };
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const [pr, vr] = await Promise.all([
        apiFetch("/part", user?.token),
        apiFetch("/vendor", user?.token),
      ]);
      const ps: PartDto[] = await pr.json();
      setParts(ps);
      setVendors(await vr.json());
      // Load saved part images from localStorage
      const imgs: Record<string, string> = {};
      ps.forEach((p) => {
    if (p.imageUrl) imgs[p.id] = p.imageUrl;
});
      setPartImages(imgs);
    } catch { setError("Failed to load."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.token]);

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const savePartImage = async (partId: string, url: string) => {
      setPartImages((prev) => ({ ...prev, [partId]: url }));
      await apiFetch(`/part/${partId}/image`, user?.token, {
          method: "PUT",
          body: JSON.stringify({ imageUrl: url }),
      });
  };

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const body = {
        ...form,
        price: parseFloat(form.price),
        stockQuantity: parseInt(form.stockQuantity),
        vendorId: form.vendorId || undefined,
      };
      const r = await apiFetch("/part", user?.token, { method: "POST", body: JSON.stringify(body) });
      if (!r.ok) throw new Error("Failed to create");
      const newPart: PartDto = await r.json();
      // Save the pending image against the new part's id
      if (pendingImageUrl) savePartImage(newPart.id, pendingImageUrl);
      flash("Part created."); setCreateOpen(false); setForm(emptyForm); setPendingImageUrl(""); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      const body = {
        ...form,
        price: parseFloat(form.price),
        stockQuantity: parseInt(form.stockQuantity),
        vendorId: form.vendorId || undefined,
      };
      const r = await apiFetch(`/part/${editTarget.id}`, user?.token, { method: "PUT", body: JSON.stringify(body) });
      if (!r.ok) throw new Error("Failed to update");
      // Save updated image
      savePartImage(editTarget.id, pendingImageUrl);
      flash("Part updated."); setEditTarget(null); setPendingImageUrl(""); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/part/${deleteTarget.id}`, user?.token, { method: "DELETE" });
      flash("Part deleted."); setDeleteTarget(null); load();
    } catch { setError("Failed to delete."); }
  };

  const openEdit = (p: PartDto) => {
    setForm({ name: p.name, description: p.description, category: p.category, price: String(p.price), stockQuantity: String(p.stockQuantity), vendorId: p.vendorId || "" });
    setPendingImageUrl(partImages[p.id] || "");
    setEditTarget(p);
  };

  const filtered = parts.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
  );

  const stockColor = (qty: number) =>
    qty === 0 ? "text-[#F09595]" : qty <= 9 ? "text-[#EF9F27]" : "text-[#5DCAA5]";

  const partFormJsx = (
    <div className="space-y-4">
      {/* Image upload at top of form */}
      <div className="flex justify-center pb-1">
        <ImageUpload
          currentUrl={pendingImageUrl}
          folder="parts"
          shape="square"
          size={100}
          onUploaded={setPendingImageUrl}
          placeholder={<Package size={28} className="text-[#3A3530]" />}
        />
      </div>
      {PART_FIELDS.map(({ label, key }) => (
        <div key={key}>
          <label className={labelClass}>{label}</label>
          <input
            type={key === "price" || key === "stockQuantity" ? "number" : "text"}
            className={inputClass}
            value={(form as Record<string, string>)[key]}
            onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
          />
        </div>
      ))}
      <div>
        <label className={labelClass}>Vendor (Optional)</label>
        <select
          className={selectClass}
          value={form.vendorId}
          onChange={(e) => setForm((prev) => ({ ...prev, vendorId: e.target.value }))}
        >
          <option value="">— No Vendor —</option>
          {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>
    </div>
  );

  return (
    <PageWrapper>
      <PageHeader
        title="Parts Management"
        subtitle="Create, update, and manage vehicle part inventory."
        action={
          <button
            onClick={() => { setForm(emptyForm); setPendingImageUrl(""); setCreateOpen(true); }}
            className={primaryBtn + " flex items-center gap-2"}
          >
            <Plus size={14} /> Add Part
          </button>
        }
      />

      {error && <div className="mb-4"><ErrorMsg message={error} /></div>}
      {success && <div className="mb-4"><SuccessMsg message={success} /></div>}

      {/* Search bar */}
      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9490]" />
        <input
          type="text"
          placeholder="Search parts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputClass + " pl-9"}
        />
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? <EmptyState message="No parts found." /> : (
        /* Card grid instead of a plain table — images shine here */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="bg-[#1A1815] border border-[#3A3530] rounded-xl overflow-hidden flex flex-col hover:border-[#C97B4A]/40 transition-colors cursor-pointer"
              onClick={() => setViewTarget(p)}
            >
              {/* Part image */}
              <div className="h-40 bg-[#0C0B0A] flex items-center justify-center relative">
                {partImages[p.id] ? (
                  <img src={partImages[p.id]} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <Package size={36} strokeWidth={1} className="text-[#3A3530]" />
                )}
                {/* Low stock badge */}
                {p.stockQuantity <= 9 && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#0C0B0A]/80 px-2 py-0.5 rounded-full">
                    <AlertCircle size={10} className={stockColor(p.stockQuantity)} />
                    <span className={`text-[10px] font-[Syne] font-bold ${stockColor(p.stockQuantity)}`}>
                      {p.stockQuantity === 0 ? "Out" : "Low"}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 flex flex-col flex-1">
                <p className="font-[Syne] font-bold text-[#EDEAE4] text-sm leading-tight mb-1">{p.name}</p>
                <p className="text-[11px] text-[#9A9490] font-[DM_Sans] mb-3">{p.category}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-[Syne] font-bold text-[#C97B4A]">{fmtCurrency(p.price)}</span>
                  <span className={`text-xs font-[Syne] font-bold ${stockColor(p.stockQuantity)}`}>
                    {p.stockQuantity} in stock
                  </span>
                </div>
                {/* Action buttons */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-[#3A3530]/50">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                    className="flex-1 flex items-center justify-center gap-1 text-xs text-[#9A9490] hover:text-[#EDEAE4] py-1.5 rounded-lg hover:bg-[#3A3530]/30 transition-colors font-[DM_Sans]"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}
                    className="flex-1 flex items-center justify-center gap-1 text-xs text-[#9A9490] hover:text-[#F09595] py-1.5 rounded-lg hover:bg-[#F09595]/10 transition-colors font-[DM_Sans]"
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Part Modal */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Part Details" width="max-w-md">
        {viewTarget && (
          <div>
            {partImages[viewTarget.id] && (
              <img src={partImages[viewTarget.id]} alt={viewTarget.name} className="w-full h-48 object-cover rounded-lg mb-4" />
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Name", val: viewTarget.name },
                { label: "Category", val: viewTarget.category },
                { label: "Price", val: fmtCurrency(viewTarget.price) },
                { label: "Stock", val: String(viewTarget.stockQuantity) },
                { label: "Vendor", val: viewTarget.vendorName || "—" },
                { label: "Added", val: fmtDate(viewTarget.createdAt) },
              ].map(({ label, val }) => (
                <div key={label}>
                  <p className="text-[10px] font-[Syne] font-semibold text-[#9A9490] uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="text-[#EDEAE4] font-[DM_Sans]">{val}</p>
                </div>
              ))}
            </div>
            {viewTarget.description && (
              <div className="mt-4">
                <p className="text-[10px] font-[Syne] font-semibold text-[#9A9490] uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-[#9A9490] font-[DM_Sans]">{viewTarget.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add New Part">
        {partFormJsx}
        <div className="flex gap-3 pt-4">
          <button onClick={handleCreate} disabled={submitting} className={primaryBtn}>
            {submitting ? "Creating…" : "Create Part"}
          </button>
          <button onClick={() => setCreateOpen(false)} className={secondaryBtn}>Cancel</button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Part">
        {partFormJsx}
        <div className="flex gap-3 pt-4">
          <button onClick={handleEdit} disabled={submitting} className={primaryBtn}>
            {submitting ? "Saving…" : "Save Changes"}
          </button>
          <button onClick={() => setEditTarget(null)} className={secondaryBtn}>Cancel</button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Part">
        <p className="text-[#9A9490] text-sm mb-5 font-[DM_Sans]">
          Delete <span className="text-[#EDEAE4] font-medium">{deleteTarget?.name}</span>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={handleDelete} className={dangerBtn}>Delete</button>
          <button onClick={() => setDeleteTarget(null)} className={secondaryBtn}>Cancel</button>
        </div>
      </Modal>
    </PageWrapper>
  );
}
