import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch, fmtDate } from "../../utils/api";
import { PageHeader, PageWrapper, DataTable, Th, Td, TrHover } from "../../components/shared/PortalLayout";
import { Modal } from "../../components/shared/Modal";
import { Spinner, EmptyState, ErrorMsg, SuccessMsg } from "../../components/shared/Feedback";
import { inputClass, labelClass, primaryBtn, secondaryBtn, dangerBtn } from "../../components/shared/formStyles";
import type { VendorDto } from "../../types";
import { Plus, Pencil, Trash2 } from "lucide-react";


type VendorFormProps = {
  form: {
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
  };
  setForm: React.Dispatch<React.SetStateAction<{
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
  }>>;
};

function FormFields({ form, setForm }: VendorFormProps) {
  return (
    <div className="space-y-4">
      {[
        { label: "Vendor Name", key: "name" },
        { label: "Contact Person", key: "contactPerson" },
        { label: "Phone", key: "phone" },
        { label: "Email", key: "email" },
        { label: "Address", key: "address" },
      ].map(({ label, key }) => (
        <div key={key}>
          <label className={labelClass}>{label}</label>

          <input
            type="text"
            className={inputClass}
            value={form[key as keyof typeof form]}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                [key]: e.target.value,
              }))
            }
          />
        </div>
      ))}
    </div>
  );
}

export default function VendorManagement() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<VendorDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendorDto | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emptyForm = { name: "", contactPerson: "", phone: "", email: "", address: "" };
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiFetch("/vendor", user?.token);
      setVendors(await r.json());
    } catch { setError("Failed to load vendors."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.token]);

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const r = await apiFetch("/vendor", user?.token, { method: "POST", body: JSON.stringify(form) });
      if (!r.ok) throw new Error("Failed to create vendor");
      flash("Vendor created."); setCreateOpen(false); setForm(emptyForm); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      const r = await apiFetch(`/vendor/${editTarget.id}`, user?.token, { method: "PUT", body: JSON.stringify(form) });
      if (!r.ok) throw new Error("Failed to update vendor");
      flash("Vendor updated."); setEditTarget(null); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/vendor/${deleteTarget.id}`, user?.token, { method: "DELETE" });
      flash("Vendor deleted."); setDeleteTarget(null); load();
    } catch { setError("Failed to delete vendor."); }
  };

  const openEdit = (v: VendorDto) => {
    setForm({ name: v.name, contactPerson: v.contactPerson, phone: v.phone, email: v.email, address: v.address });
    setEditTarget(v);
  };

  

  return (
    <PageWrapper>
      <PageHeader
        title="Vendor Management"
        subtitle="Manage your parts suppliers and vendor contacts."
        action={
          <button onClick={() => { setForm(emptyForm); setCreateOpen(true); }} className={primaryBtn + " flex items-center gap-2"}>
            <Plus size={14} /> Add Vendor
          </button>
        }
      />

      {error && <div className="mb-4"><ErrorMsg message={error} /></div>}
      {success && <div className="mb-4"><SuccessMsg message={success} /></div>}

      {loading ? <Spinner /> : vendors.length === 0 ? <EmptyState message="No vendors found. Add your first vendor." /> : (
        <DataTable>
          <thead>
            <tr>
              <Th>Name</Th><Th>Contact Person</Th><Th>Email</Th><Th>Phone</Th><Th>Added</Th><Th right>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <TrHover key={v.id}>
                <Td><span className="font-medium">{v.name}</span></Td>
                <Td muted>{v.contactPerson}</Td>
                <Td muted>{v.email}</Td>
                <Td muted>{v.phone}</Td>
                <Td muted>{fmtDate(v.createdAt)}</Td>
                <Td right>
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => openEdit(v)} className="p-1.5 text-[#9A9490] hover:text-[#EDEAE4] transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteTarget(v)} className="p-1.5 text-[#9A9490] hover:text-[#F09595] transition-colors"><Trash2 size={14} /></button>
                  </div>
                </Td>
              </TrHover>
            ))}
          </tbody>
        </DataTable>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Vendor">
        <FormFields form={form} setForm={setForm} />
        <div className="flex gap-3 pt-4">
          <button onClick={handleCreate} disabled={submitting} className={primaryBtn}>{submitting ? "Creating…" : "Create Vendor"}</button>
          <button onClick={() => setCreateOpen(false)} className={secondaryBtn}>Cancel</button>
        </div>
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Vendor">
        <FormFields form={form} setForm={setForm} />
        <div className="flex gap-3 pt-4">
          <button onClick={handleEdit} disabled={submitting} className={primaryBtn}>{submitting ? "Saving…" : "Save Changes"}</button>
          <button onClick={() => setEditTarget(null)} className={secondaryBtn}>Cancel</button>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Vendor">
        <p className="text-[#9A9490] text-sm mb-5 font-[DM_Sans]">
          Delete <span className="text-[#EDEAE4] font-medium">{deleteTarget?.name}</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={handleDelete} className={dangerBtn}>Delete</button>
          <button onClick={() => setDeleteTarget(null)} className={secondaryBtn}>Cancel</button>
        </div>
      </Modal>
    </PageWrapper>
  );
}
