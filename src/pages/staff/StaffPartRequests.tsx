import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch, fmtDate } from "../../utils/api";
import {
  PageHeader,
  PageWrapper,
  DataTable,
  Th,
  Td,
  TrHover,
} from "../../components/shared/PortalLayout";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { Spinner, EmptyState, ErrorMsg, SuccessMsg } from "../../components/shared/Feedback";
import { Modal } from "../../components/shared/Modal";
import { primaryBtn, secondaryBtn, dangerBtn } from "../../components/shared/formStyles";
import type { PartRequest } from "../../types";
import { Package, CheckCircle, XCircle, Eye, RefreshCw } from "lucide-react";

interface PartRequestWithCustomer extends PartRequest {
  customerName?: string;
  customerEmail?: string;
}

type FilterStatus = "All" | "Pending" | "Fulfilled" | "Rejected";

export default function StaffPartRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PartRequestWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("All");
  const [viewTarget, setViewTarget] = useState<PartRequestWithCustomer | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    request: PartRequestWithCustomer;
    action: "Fulfilled" | "Rejected";
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3500);
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await apiFetch("/partrequest", user?.token);
      if (!r.ok) throw new Error("Failed to fetch part requests");
      const data: PartRequestWithCustomer[] = await r.json();
      setRequests(data);
    } catch {
      setError("Failed to load part requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.token]);

  const handleStatusUpdate = async (id: string, status: "Fulfilled" | "Rejected") => {
    setSubmitting(true);
    try {
      const r = await apiFetch(`/partrequest/${id}/status`, user?.token, {
        method: "PATCH",
        body: JSON.stringify(status),
      });
      if (!r.ok) throw new Error("Failed to update status");
      flash(`Part request marked as ${status.toLowerCase()}.`);
      setConfirmAction(null);
      setViewTarget(null);
      load();
    } catch {
      setError("Failed to update part request status.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered =
    filter === "All" ? requests : requests.filter((r) => r.status === filter);

  const counts = {
    All: requests.length,
    Pending: requests.filter((r) => r.status === "Pending").length,
    Fulfilled: requests.filter((r) => r.status === "Fulfilled").length,
    Rejected: requests.filter((r) => r.status === "Rejected").length,
  };

  const filterTabs: FilterStatus[] = ["All", "Pending", "Fulfilled", "Rejected"];

  return (
    <PageWrapper>
      <PageHeader
        title="Part Requests"
        subtitle="Review and action customer part requests."
        action={
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 border border-[#3A3530] text-[#9A9490] hover:text-[#EDEAE4] hover:border-[#9A9490] rounded-lg text-sm font-[Syne] transition-colors"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        }
      />

      {error && (
        <div className="mb-4">
          <ErrorMsg message={error} />
        </div>
      )}
      {success && (
        <div className="mb-4">
          <SuccessMsg message={success} />
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6">
        {filterTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-[Syne] font-semibold transition-colors border ${
              filter === tab
                ? "bg-[#85B7EB]/15 text-[#85B7EB] border-[#85B7EB]/30"
                : "border-[#3A3530] text-[#9A9490] hover:text-[#EDEAE4] hover:border-[#9A9490]"
            }`}
          >
            {tab}
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                filter === tab ? "bg-[#85B7EB]/20 text-[#85B7EB]" : "bg-[#3A3530] text-[#9A9490]"
              }`}
            >
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          message={
            filter === "All"
              ? "No part requests yet."
              : `No ${filter.toLowerCase()} part requests.`
          }
        />
      ) : (
        <DataTable>
          <thead>
            <tr>
              <Th>Part Name</Th>
              <Th>Customer</Th>
              <Th>Description</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th right>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((req) => (
              <TrHover key={req.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#85B7EB]/10 rounded-lg shrink-0">
                      <Package size={13} className="text-[#85B7EB]" />
                    </div>
                    <span className="font-medium font-[Syne] text-[#EDEAE4]">{req.partName}</span>
                  </div>
                </Td>
                <Td>
                  <div>
                    <p className="text-[#EDEAE4] font-medium">
                      {req.customerName || `Customer #${req.customerId}`}
                    </p>
                    {req.customerEmail && (
                      <p className="text-xs text-[#9A9490] mt-0.5">{req.customerEmail}</p>
                    )}
                  </div>
                </Td>
                <Td muted>
                  <span className="line-clamp-2 max-w-xs block">
                    {req.description || <span className="italic text-[#9A9490]/60">No description</span>}
                  </span>
                </Td>
                <Td muted>{fmtDate(req.createdAt)}</Td>
                <Td>
                  <StatusBadge status={req.status || "Pending"} />
                </Td>
                <Td right>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setViewTarget(req)}
                      className="p-1.5 text-[#9A9490] hover:text-[#EDEAE4] transition-colors"
                      title="View details"
                    >
                      <Eye size={14} />
                    </button>
                    {req.status === "Pending" && (
                      <>
                        <button
                          onClick={() => setConfirmAction({ request: req, action: "Fulfilled" })}
                          className="p-1.5 text-[#9A9490] hover:text-[#5DCAA5] transition-colors"
                          title="Mark as Fulfilled"
                        >
                          <CheckCircle size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmAction({ request: req, action: "Rejected" })}
                          className="p-1.5 text-[#9A9490] hover:text-[#F09595] transition-colors"
                          title="Reject"
                        >
                          <XCircle size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </Td>
              </TrHover>
            ))}
          </tbody>
        </DataTable>
      )}

      {/* View detail modal */}
      <Modal
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="Part Request Details"
      >
        {viewTarget && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Part Name", val: viewTarget.partName },
                { label: "Status", val: <StatusBadge status={viewTarget.status || "Pending"} /> },
                {
                  label: "Customer",
                  val: viewTarget.customerName || `Customer #${viewTarget.customerId}`,
                },
                { label: "Email", val: viewTarget.customerEmail || "—" },
                { label: "Date Submitted", val: fmtDate(viewTarget.createdAt) },
              ].map(({ label, val }) => (
                <div key={label}>
                  <p className="text-[#9A9490] text-xs font-[Syne] font-semibold uppercase tracking-wider mb-1">
                    {label}
                  </p>
                  <div className="text-[#EDEAE4]">{val}</div>
                </div>
              ))}
            </div>

            {viewTarget.description && (
              <div>
                <p className="text-[#9A9490] text-xs font-[Syne] font-semibold uppercase tracking-wider mb-1">
                  Description
                </p>
                <p className="text-sm text-[#EDEAE4] font-[DM_Sans] bg-[#0C0B0A] border border-[#3A3530] rounded-lg p-3 leading-relaxed">
                  {viewTarget.description}
                </p>
              </div>
            )}

            {viewTarget.status === "Pending" && (
              <div className="flex gap-3 pt-2 border-t border-[#3A3530]">
                <button
                  onClick={() =>
                    setConfirmAction({ request: viewTarget, action: "Fulfilled" })
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-[#1D9E75]/10 hover:bg-[#1D9E75]/20 border border-[#1D9E75]/30 text-[#5DCAA5] rounded-lg text-sm font-[Syne] transition-colors"
                >
                  <CheckCircle size={14} /> Mark Fulfilled
                </button>
                <button
                  onClick={() =>
                    setConfirmAction({ request: viewTarget, action: "Rejected" })
                  }
                  className={dangerBtn + " flex items-center gap-2"}
                >
                  <XCircle size={14} /> Reject
                </button>
                <button onClick={() => setViewTarget(null)} className={secondaryBtn}>
                  Close
                </button>
              </div>
            )}
            {viewTarget.status !== "Pending" && (
              <div className="pt-2 border-t border-[#3A3530]">
                <button onClick={() => setViewTarget(null)} className={secondaryBtn}>
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirm action modal */}
      <Modal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={
          confirmAction?.action === "Fulfilled"
            ? "Confirm Fulfillment"
            : "Confirm Rejection"
        }
      >
        {confirmAction && (
          <div>
            <p className="text-[#9A9490] text-sm mb-2 font-[DM_Sans]">
              {confirmAction.action === "Fulfilled"
                ? "Mark this part request as fulfilled?"
                : "Reject this part request?"}
            </p>
            <div className="bg-[#0C0B0A] border border-[#3A3530] rounded-lg p-3 mb-5">
              <p className="text-[#EDEAE4] font-[Syne] font-bold text-sm">
                {confirmAction.request.partName}
              </p>
              {confirmAction.request.customerName && (
                <p className="text-xs text-[#9A9490] font-[DM_Sans] mt-1">
                  Requested by {confirmAction.request.customerName}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              {confirmAction.action === "Fulfilled" ? (
                <button
                  onClick={() =>
                    handleStatusUpdate(confirmAction.request.id, "Fulfilled")
                  }
                  disabled={submitting}
                  className={primaryBtn + " flex items-center gap-2"}
                >
                  <CheckCircle size={14} />
                  {submitting ? "Updating…" : "Yes, Fulfill"}
                </button>
              ) : (
                <button
                  onClick={() =>
                    handleStatusUpdate(confirmAction.request.id, "Rejected")
                  }
                  disabled={submitting}
                  className={dangerBtn + " flex items-center gap-2"}
                >
                  <XCircle size={14} />
                  {submitting ? "Updating…" : "Yes, Reject"}
                </button>
              )}
              <button
                onClick={() => setConfirmAction(null)}
                disabled={submitting}
                className={secondaryBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
