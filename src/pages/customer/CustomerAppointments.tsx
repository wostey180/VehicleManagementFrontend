import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch, fmtDateTime } from "../../utils/api";
import { PageHeader, PageWrapper } from "../../components/shared/PortalLayout";
import { Modal } from "../../components/shared/Modal";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { Spinner, ErrorMsg, SuccessMsg } from "../../components/shared/Feedback";
import { inputClass, selectClass, labelClass, primaryBtn, secondaryBtn, dangerBtn } from "../../components/shared/formStyles";
import type { AppointmentResponse, VehicleResponse } from "../../types";
import { Plus, Trash2, Calendar } from "lucide-react";

function useCustomerId() {
  return localStorage.getItem("reviio_customerId") || "";
}

export default function CustomerAppointments() {
  const { user } = useAuth();
  const customerId = useCustomerId();
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppointmentResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [vehicleId, setVehicleId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [notes, setNotes] = useState("");

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

 const load = async () => {
  const customerId = localStorage.getItem("reviio_customerId") || "";
  if (!customerId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [ar, vr] = await Promise.all([
        apiFetch(`/appointment/customer/${customerId}`, user?.token),
        apiFetch(`/customer/${customerId}/vehicles`, user?.token),
      ]);
      setAppointments(await ar.json());
      setVehicles(await vr.json());
    } catch { setError("Failed to load appointments."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [customerId, user?.token]);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const body = { customerId: parseInt(customerId, 10), vehicleId: parseInt(vehicleId, 10), appointmentDate, notes };
      const r = await apiFetch("/appointment", user?.token, { method: "POST", body: JSON.stringify(body) });
      if (!r.ok) throw new Error("Failed to book appointment");
      flash("Appointment booked successfully.");
      setCreateOpen(false); setVehicleId(""); setAppointmentDate(""); setNotes("");
      load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/appointment/${deleteTarget.id}`, user?.token, { method: "DELETE" });
      flash("Appointment cancelled."); setDeleteTarget(null); load();
    } catch { setError("Failed to cancel appointment."); }
  };

  return (
    <PageWrapper>
      <PageHeader
        title="My Appointments"
        subtitle="Book and manage your vehicle service appointments."
        action={
          <button onClick={() => setCreateOpen(true)} className={primaryBtn + " flex items-center gap-2"}>
            <Plus size={14} /> Book Appointment
          </button>
        }
      />

      {error && <div className="mb-4"><ErrorMsg message={error} /></div>}
      {success && <div className="mb-4"><SuccessMsg message={success} /></div>}

      {loading ? <Spinner /> : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Calendar size={40} strokeWidth={1.2} className="text-[#3A3530]" />
          <div className="text-center">
            <p className="text-[#EDEAE4] font-[Syne] font-bold mb-1">No appointments yet</p>
            <p className="text-sm text-[#9A9490] font-[DM_Sans]">Book a service appointment for your vehicle.</p>
          </div>
          <button onClick={() => setCreateOpen(true)} className={primaryBtn}>Book Now</button>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <div key={a.id} className="bg-[#1A1815] border border-[#3A3530] rounded-xl p-5 flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-[#EF9F27]/10 rounded-lg shrink-0">
                  <Calendar size={16} className="text-[#EF9F27]" />
                </div>
                <div>
                  <p className="font-[Syne] font-bold text-[#EDEAE4] mb-1">{fmtDateTime(a.appointmentDate)}</p>
                  {a.notes && <p className="text-sm text-[#9A9490] font-[DM_Sans] mb-2">{a.notes}</p>}
                  <StatusBadge status={a.status} />
                </div>
              </div>
              {(a.status === "Pending" || a.status === "Confirmed") && (
                <button onClick={() => setDeleteTarget(a)} className="p-2 text-[#9A9490] hover:text-[#F09595] transition-colors shrink-0">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Book Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Book Appointment">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Vehicle</label>
            <select className={selectClass} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              <option value="">Select your vehicle…</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.year} {v.make} {v.model} — {v.licensePlate}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Preferred Date & Time</label>
            <input type="datetime-local" className={inputClass} value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Notes (optional)</label>
            <textarea className={inputClass + " resize-none h-24"} placeholder="Describe the issue or service needed…"
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleCreate} disabled={submitting} className={primaryBtn}>{submitting ? "Booking…" : "Book Appointment"}</button>
            <button onClick={() => setCreateOpen(false)} className={secondaryBtn}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Cancel Confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Cancel Appointment">
        <p className="text-[#9A9490] text-sm mb-5 font-[DM_Sans]">
          Are you sure you want to cancel your appointment on{" "}
          <span className="text-[#EDEAE4] font-medium">{deleteTarget ? fmtDateTime(deleteTarget.appointmentDate) : ""}</span>?
        </p>
        <div className="flex gap-3">
          <button onClick={handleDelete} className={dangerBtn}>Cancel Appointment</button>
          <button onClick={() => setDeleteTarget(null)} className={secondaryBtn}>Keep It</button>
        </div>
      </Modal>
    </PageWrapper>
  );
}
