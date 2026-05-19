import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch, fmtDate } from "../../utils/api";
import { PageHeader, PageWrapper } from "../../components/shared/PortalLayout";
import { Modal } from "../../components/shared/Modal";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { Spinner, ErrorMsg, SuccessMsg } from "../../components/shared/Feedback";
import { inputClass, labelClass, primaryBtn, secondaryBtn, dangerBtn } from "../../components/shared/formStyles";
import type { PartRequest } from "../../types";
import { Plus, Trash2, Package } from "lucide-react";

function useCustomerId() {
  return localStorage.getItem("reviio_customerId") || "";
}

export default function CustomerPartRequests() {
  const { user } = useAuth();
  const customerId = useCustomerId();
  const [requests, setRequests] = useState<PartRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PartRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [partName, setPartName] = useState("");
  const [description, setDescription] = useState("");

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const load = async () => {
    const customerId = localStorage.getItem("reviio_customerId") || "";
    if (!customerId) { setLoading(false); return; }
    setLoading(true);
    try {
      const r = await apiFetch(`/partrequest/customer/${customerId}`, user?.token);
      setRequests(await r.json());
    } catch { setError("Failed to load part requests."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [customerId, user?.token]);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const body = { customerId: parseInt(customerId, 10), partName, description };
      const r = await apiFetch("/partrequest", user?.token, { method: "POST", body: JSON.stringify(body) });
      if (!r.ok) throw new Error("Failed to submit request");
      flash("Part request submitted."); setCreateOpen(false); setPartName(""); setDescription(""); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/partrequest/${deleteTarget.id}`, user?.token, { method: "DELETE" });
      flash("Part request removed."); setDeleteTarget(null); load();
    } catch { setError("Failed to remove request."); }
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Part Requests"
        subtitle="Request parts that aren't currently in our inventory."
        action={
          <button onClick={() => setCreateOpen(true)} className={primaryBtn + " flex items-center gap-2"}>
            <Plus size={14} /> Request a Part
          </button>
        }
      />

      {error && <div className="mb-4"><ErrorMsg message={error} /></div>}
      {success && <div className="mb-4"><SuccessMsg message={success} /></div>}

      {loading ? <Spinner /> : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Package size={40} strokeWidth={1.2} className="text-[#3A3530]" />
          <div className="text-center">
            <p className="text-[#EDEAE4] font-[Syne] font-bold mb-1">No part requests yet</p>
            <p className="text-sm text-[#9A9490] font-[DM_Sans]">Can't find the part you need? Submit a request.</p>
          </div>
          <button onClick={() => setCreateOpen(true)} className={primaryBtn}>Request Now</button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="bg-[#1A1815] border border-[#3A3530] rounded-xl p-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-[#378ADD]/10 rounded-lg shrink-0">
                  <Package size={16} className="text-[#85B7EB]" />
                </div>
                <div>
                  <p className="font-[Syne] font-bold text-[#EDEAE4] mb-1">{r.partName}</p>
                  {r.description && <p className="text-sm text-[#9A9490] font-[DM_Sans] mb-2">{r.description}</p>}
                  <div className="flex items-center gap-3">
                    <StatusBadge status={r.status || "Pending"} />
                    <span className="text-xs text-[#9A9490] font-[DM_Sans]">{fmtDate(r.createdAt)}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setDeleteTarget(r)} className="p-2 text-[#9A9490] hover:text-[#F09595] transition-colors shrink-0">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Request a Part">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Part Name</label>
            <input type="text" className={inputClass} placeholder="e.g. Brake pads for Toyota Corolla 2019"
              value={partName} onChange={(e) => setPartName(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea className={inputClass + " resize-none h-24"} placeholder="Provide any additional details, part numbers, or specifications…"
              value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleCreate} disabled={submitting} className={primaryBtn}>{submitting ? "Submitting…" : "Submit Request"}</button>
            <button onClick={() => setCreateOpen(false)} className={secondaryBtn}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Request">
        <p className="text-[#9A9490] text-sm mb-5 font-[DM_Sans]">
          Remove request for <span className="text-[#EDEAE4] font-medium">{deleteTarget?.partName}</span>?
        </p>
        <div className="flex gap-3">
          <button onClick={handleDelete} className={dangerBtn}>Remove</button>
          <button onClick={() => setDeleteTarget(null)} className={secondaryBtn}>Keep It</button>
        </div>
      </Modal>
    </PageWrapper>
  );
}
