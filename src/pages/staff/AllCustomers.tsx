import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch, fmtCurrency, fmtDate } from "../../utils/api";
import { PageHeader, PageWrapper, DataTable, Th, Td, TrHover } from "../../components/shared/PortalLayout";
import { Modal } from "../../components/shared/Modal";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { Spinner, EmptyState, ErrorMsg } from "../../components/shared/Feedback";
import type { CustomerResponse, CustomerDetailDto } from "../../types";
import { Eye, Car, Calendar, Package, Star } from "lucide-react";

export default function AllCustomers() {
  const { user } = useAuth();
const [customers, setCustomers] = useState<CustomerDetailDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<CustomerDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"vehicles" | "appointments" | "requests" | "reviews">("vehicles");

  useEffect(() => {
    apiFetch("/staff/customers", user?.token)
      .then((r) => r.json())
      .then(setCustomers)
      .catch(() => setError("Failed to load customers."))
      .finally(() => setLoading(false));
  }, [user?.token]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setActiveTab("vehicles");
    try {
      const r = await apiFetch(`/staff/customers/${id}`, user?.token);
      setDetail(await r.json());
    } catch { setError("Failed to load customer details."); }
    finally { setDetailLoading(false); }
  };

  const updatePartRequestStatus = async (id: string, status: string) => {
  try {
    await apiFetch(`/partrequest/${id}/status`, user?.token, {
      method: "PATCH",
      body: JSON.stringify(status),
    });
    // Refresh the detail
    openDetail(detail!.customerId);
  } catch {
    setError("Failed to update part request status.");
  }
};

  return (
    <PageWrapper>
      <PageHeader title="All Customers" subtitle="View customer profiles, vehicles, history, and activity." />

      {error && <div className="mb-4"><ErrorMsg message={error} /></div>}

      {loading ? <Spinner /> : customers.length === 0 ? <EmptyState message="No customers found." /> : (
        <DataTable>
          <thead>
            <tr>
              <Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th right>Total Spent</Th><Th right>Loyalty Pts</Th><Th>Member Since</Th><Th right>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <TrHover key={c.customerId}>
                <Td><span className="font-medium">{c.fullName}</span></Td>
                <Td muted>{c.email}</Td>
                <Td muted>{c.phone || "—"}</Td>
                <Td right>{fmtCurrency(c.totalSpent)}</Td>
                <Td right><span className="text-[#EF9F27] font-[Syne] font-bold">{c.loyaltyPoints}</span></Td>
                <Td muted>{fmtDate(c.memberSince)}</Td>
                <Td right>
                  <button onClick={() => openDetail(c.customerId)} className="p-1.5 text-[#9A9490] hover:text-[#EDEAE4] transition-colors"><Eye size={14} /></button>
                </Td>
              </TrHover>
            ))}
          </tbody>
        </DataTable>
      )}

      {/* Customer Detail Modal */}
      <Modal open={!!detail || detailLoading} onClose={() => setDetail(null)} title="Customer Profile" width="max-w-3xl">
        {detailLoading ? <Spinner /> : detail && (
          <div className="space-y-5">
            {/* Header info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <h3 className="font-[Syne] font-extrabold text-xl text-[#EDEAE4] mb-1">{detail.fullName}</h3>
                <p className="text-sm text-[#9A9490] font-[DM_Sans]">{detail.email} · {detail.phone}</p>
                {detail.address && <p className="text-sm text-[#9A9490] mt-1 font-[DM_Sans]">{detail.address}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-[#9A9490] font-[Syne] uppercase tracking-wider mb-1">Total Spent</p>
                <p className="font-[Syne] font-extrabold text-xl text-[#C97B4A]">{fmtCurrency(detail.totalSpent)}</p>
                <p className="text-xs text-[#EF9F27] mt-1">{detail.loyaltyPoints} loyalty pts</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-[#3A3530] pb-0">
              {[
                { key: "vehicles", label: "Vehicles", icon: Car, count: detail.vehicles?.length },
                { key: "appointments", label: "Appointments", icon: Calendar, count: detail.appointments?.length },
                { key: "requests", label: "Part Requests", icon: Package, count: detail.partRequests?.length },
                { key: "reviews", label: "Reviews", icon: Star, count: detail.reviews?.length },
              ].map(({ key, label, icon: Icon, count }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as typeof activeTab)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-[Syne] border-b-2 transition-colors -mb-px ${
                    activeTab === key
                      ? "border-[#C97B4A] text-[#C97B4A]"
                      : "border-transparent text-[#9A9490] hover:text-[#EDEAE4]"
                  }`}
                >
                  <Icon size={13} /> {label}
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === key ? "bg-[#C97B4A]/20 text-[#C97B4A]" : "bg-[#3A3530]/50 text-[#9A9490]"}`}>
                    {count ?? 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="max-h-72 overflow-y-auto">
              {activeTab === "vehicles" && (
                detail.vehicles?.length ? (
                  <div className="space-y-2">
                    {detail.vehicles.map((v) => (
                      <div key={v.id} className="flex items-center gap-4 p-3 bg-[#0C0B0A] border border-[#3A3530]/50 rounded-lg">
                        <Car size={16} className="text-[#9A9490] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#EDEAE4] font-[DM_Sans]">{v.year} {v.make} {v.model}</p>
                          <p className="text-xs text-[#9A9490]">{v.licensePlate} {v.vin ? `· VIN: ${v.vin}` : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState message="No vehicles registered." />
              )}

              {activeTab === "appointments" && (
                detail.appointments?.length ? (
                  <div className="space-y-2">
                    {detail.appointments.map((a) => (
                      <div key={a.id} className="flex items-center justify-between p-3 bg-[#0C0B0A] border border-[#3A3530]/50 rounded-lg">
                        <div>
                          <p className="text-sm text-[#EDEAE4] font-[DM_Sans]">{fmtDate(a.appointmentDate)}</p>
                          {a.notes && <p className="text-xs text-[#9A9490] mt-0.5">{a.notes}</p>}
                        </div>
                        <StatusBadge status={a.status} />
                      </div>
                    ))}
                  </div>
                ) : <EmptyState message="No appointments." />
              )}
{activeTab === "requests" && (
  detail.partRequests?.length ? (
    <div className="space-y-2">
      {detail.partRequests.map((r) => (
        <div key={r.id} className="flex items-center justify-between p-3 bg-[#0C0B0A] border border-[#3A3530]/50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-[#EDEAE4] font-[DM_Sans]">{r.partName}</p>
            <p className="text-xs text-[#9A9490] mt-0.5">{r.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={r.status || "Pending"} />
            {(r.status === "Pending") && (
              <>
                <button
                  onClick={() => updatePartRequestStatus(r.id, "Fulfilled")}
                  className="text-xs px-2 py-1 bg-[#1D9E75]/10 hover:bg-[#1D9E75]/20 border border-[#1D9E75]/30 text-[#5DCAA5] rounded font-[Syne] transition-colors"
                >
                  Fulfilled
                </button>
                <button
                  onClick={() => updatePartRequestStatus(r.id, "Rejected")}
                  className="text-xs px-2 py-1 bg-[#E24B4A]/10 hover:bg-[#E24B4A]/20 border border-[#E24B4A]/30 text-[#F09595] rounded font-[Syne] transition-colors"
                >
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  ) : <EmptyState message="No part requests." />
)}

              {activeTab === "reviews" && (
                detail.reviews?.length ? (
                  <div className="space-y-2">
                    {detail.reviews.map((r) => (
                      <div key={r.id} className="p-3 bg-[#0C0B0A] border border-[#3A3530]/50 rounded-lg">
                        <div className="flex items-center gap-1 mb-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={12} fill={i < r.rating ? "#EF9F27" : "none"} className={i < r.rating ? "text-[#EF9F27]" : "text-[#3A3530]"} />
                          ))}
                          <span className="text-xs text-[#9A9490] ml-2">{fmtDate(r.createdAt)}</span>
                        </div>
                        <p className="text-sm text-[#EDEAE4] font-[DM_Sans]">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState message="No reviews." />
              )}
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
