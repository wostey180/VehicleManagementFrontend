import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch, fmtDateTime } from "../../utils/api";
import { PageHeader, PageWrapper, DataTable, Th, Td, TrHover } from "../../components/shared/PortalLayout";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { Spinner, EmptyState, ErrorMsg, SuccessMsg } from "../../components/shared/Feedback";
import type { AppointmentResponse } from "../../types";
import { CheckCircle, XCircle, CheckSquare } from "lucide-react";

export default function StaffAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiFetch("/appointment", user?.token);
      setAppointments(await r.json());
    } catch { setError("Failed to load appointments."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.token]);

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const updateStatus = async (id: string, status: string) => {
    try {
      const r = await apiFetch(`/appointment/${id}/status`, user?.token, {
        method: "PATCH",
        body: JSON.stringify(status),
      });
      if (!r.ok) throw new Error("Failed to update");
      flash(`Appointment ${status.toLowerCase()}.`);
      load();
    } catch { setError("Failed to update status."); }
  };

  return (
    <PageWrapper>
      <PageHeader title="Appointments" subtitle="Manage all customer service appointments." />

      {error && <div className="mb-4"><ErrorMsg message={error} /></div>}
      {success && <div className="mb-4"><SuccessMsg message={success} /></div>}

      {loading ? <Spinner /> : appointments.length === 0 ? <EmptyState message="No appointments yet." /> : (
        <DataTable>
          <thead>
            <tr>
              <Th>Date</Th><Th>Notes</Th><Th>Status</Th><Th right>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <TrHover key={a.id}>
                <Td>{fmtDateTime(a.appointmentDate)}</Td>
                <Td muted>{a.notes || "—"}</Td>
                <Td><StatusBadge status={a.status} /></Td>
                <Td right>
                  <div className="flex items-center gap-2 justify-end">
                    {a.status === "Pending" && (
                      <button
                        onClick={() => updateStatus(a.id, "Confirmed")}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-[#1D9E75]/10 hover:bg-[#1D9E75]/20 border border-[#1D9E75]/30 text-[#5DCAA5] rounded-lg font-[Syne] transition-colors"
                      >
                        <CheckCircle size={12} /> Confirm
                      </button>
                    )}
                    {a.status === "Confirmed" && (
                      <button
                        onClick={() => updateStatus(a.id, "Completed")}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-[#378ADD]/10 hover:bg-[#378ADD]/20 border border-[#378ADD]/30 text-[#85B7EB] rounded-lg font-[Syne] transition-colors"
                      >
                        <CheckSquare size={12} /> Complete
                      </button>
                    )}
                    {(a.status === "Pending" || a.status === "Confirmed") && (
                      <button
                        onClick={() => updateStatus(a.id, "Cancelled")}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-[#E24B4A]/10 hover:bg-[#E24B4A]/20 border border-[#E24B4A]/30 text-[#F09595] rounded-lg font-[Syne] transition-colors"
                      >
                        <XCircle size={12} /> Cancel
                      </button>
                    )}
                  </div>
                </Td>
              </TrHover>
            ))}
          </tbody>
        </DataTable>
      )}
    </PageWrapper>
  );
}
