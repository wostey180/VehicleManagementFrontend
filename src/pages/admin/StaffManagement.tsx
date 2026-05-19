import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch, fmtDate } from "../../utils/api";
import { PageHeader, PageWrapper, DataTable, Th, Td, TrHover } from "../../components/shared/PortalLayout";
import { Modal } from "../../components/shared/Modal";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { Spinner, EmptyState, ErrorMsg, SuccessMsg } from "../../components/shared/Feedback";
import { inputClass, selectClass, labelClass, primaryBtn, secondaryBtn, dangerBtn } from "../../components/shared/formStyles";
import type { StaffResponse } from "../../types";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function StaffManagement() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffResponse | null>(null);

  // Form
  const emptyForm = { fullName: "", email: "", password: "", role: "Staff", phone: "", address: "" };
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const r = await apiFetch("/staff", user?.token);
      setStaff(await r.json());
    } catch { setError("Failed to load staff."); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadStaff(); }, [user?.token]);

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const r = await apiFetch("/staff", user?.token, { method: "POST", body: JSON.stringify(form) });
      if (!r.ok) { const e = await r.json(); throw new Error(e?.message || "Failed to create"); }
      flash("Staff member created."); setCreateOpen(false); setForm(emptyForm); loadStaff();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      const body = { fullName: form.fullName, phone: form.phone, address: form.address, role: form.role, isActive: true };
      const r = await apiFetch(`/staff/${editTarget.id}`, user?.token, { method: "PUT", body: JSON.stringify(body) });
      if (!r.ok) throw new Error("Failed to update");
      flash("Staff member updated."); setEditTarget(null); loadStaff();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/staff/${deleteTarget.id}`, user?.token, { method: "DELETE" });
      flash("Staff member deleted."); setDeleteTarget(null); loadStaff();
    } catch { setError("Failed to delete."); }
  };

  const openEdit = (s: StaffResponse) => {
    setForm({ fullName: s.fullName, email: s.email, password: "", role: s.role, phone: s.phone, address: s.address });
    setEditTarget(s);
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Staff Management"
        subtitle="Manage staff accounts and roles."
        action={
          <button onClick={() => { setForm(emptyForm); setCreateOpen(true); }} className={primaryBtn + " flex items-center gap-2"}>
            <Plus size={14} /> Add Staff
          </button>
        }
      />

      {error && <div className="mb-4"><ErrorMsg message={error} /></div>}
      {success && <div className="mb-4"><SuccessMsg message={success} /></div>}

      {loading ? <Spinner /> : staff.length === 0 ? <EmptyState message="No staff accounts found." /> : (
        <DataTable>
          <thead>
            <tr>
              <Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Phone</Th><Th>Status</Th><Th>Joined</Th><Th right>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <TrHover key={s.id}>
                <Td><span className="font-medium">{s.fullName}</span></Td>
                <Td muted>{s.email}</Td>
                <Td>
                  <span className={`text-xs font-[Syne] font-bold uppercase tracking-wider ${s.role === "Admin" ? "text-[#C97B4A]" : "text-[#85B7EB]"}`}>
                    {s.role}
                  </span>
                </Td>
                <Td muted>{s.phone || "—"}</Td>
                <Td><StatusBadge status={s.isActive ? "Active" : "Inactive"} /></Td>
                <Td muted>{fmtDate(s.createdAt)}</Td>
                <Td right>
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => openEdit(s)} className="p-1.5 text-[#9A9490] hover:text-[#EDEAE4] transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteTarget(s)} className="p-1.5 text-[#9A9490] hover:text-[#F09595] transition-colors"><Trash2 size={14} /></button>
                  </div>
                </Td>
              </TrHover>
            ))}
          </tbody>
        </DataTable>
      )}

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Staff Member">
        <div className="space-y-4">
          {[
            { label: "Full Name", key: "fullName", type: "text" },
            { label: "Email", key: "email", type: "email" },
            { label: "Password", key: "password", type: "password" },
            { label: "Phone", key: "phone", type: "text" },
            { label: "Address", key: "address", type: "text" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className={labelClass}>{label}</label>
              <input type={type} className={inputClass} value={(form as Record<string, string>)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </div>
          ))}
          <div>
            <label className={labelClass}>Role</label>
            <select className={selectClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="Staff">Staff</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleCreate} disabled={submitting} className={primaryBtn}>{submitting ? "Creating…" : "Create"}</button>
            <button onClick={() => setCreateOpen(false)} className={secondaryBtn}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Staff Member">
        <div className="space-y-4">
          {[
            { label: "Full Name", key: "fullName" },
            { label: "Phone", key: "phone" },
            { label: "Address", key: "address" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className={labelClass}>{label}</label>
              <input type="text" className={inputClass} value={(form as Record<string, string>)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </div>
          ))}
          <div>
            <label className={labelClass}>Role</label>
            <select className={selectClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="Staff">Staff</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleEdit} disabled={submitting} className={primaryBtn}>{submitting ? "Saving…" : "Save Changes"}</button>
            <button onClick={() => setEditTarget(null)} className={secondaryBtn}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Staff Member">
        <p className="text-[#9A9490] text-sm mb-5 font-[DM_Sans]">
          Are you sure you want to delete <span className="text-[#EDEAE4] font-medium">{deleteTarget?.fullName}</span>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={handleDelete} className={dangerBtn}>Delete</button>
          <button onClick={() => setDeleteTarget(null)} className={secondaryBtn}>Cancel</button>
        </div>
      </Modal>
    </PageWrapper>
  );
}
