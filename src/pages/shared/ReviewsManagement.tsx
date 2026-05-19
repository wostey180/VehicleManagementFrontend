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
import { Spinner, EmptyState, ErrorMsg } from "../../components/shared/Feedback";
import { Modal } from "../../components/shared/Modal";
import { secondaryBtn } from "../../components/shared/formStyles";
import { Star, ShoppingCart, Wrench, Eye, RefreshCw, User } from "lucide-react";

interface ReviewWithCustomer {
  id: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  reviewType: "Purchase" | "Service";
  referenceId?: number;
  subject: string;
  rating: number;
  comment: string;
  createdAt: string;
}

type FilterType = "All" | "Purchase" | "Service";

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={12}
          fill={n <= rating ? "#EF9F27" : "none"}
          className={n <= rating ? "text-[#EF9F27]" : "text-[#3A3530]"}
        />
      ))}
      <span className="ml-1 text-xs text-[#9A9490] font-[DM_Sans]">{rating}/5</span>
    </div>
  );
}

function RatingBar({ label, count, total }: { label: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs font-[DM_Sans]">
      <span className="w-3 text-[#9A9490] text-right">{label}</span>
      <Star size={10} fill="#EF9F27" className="text-[#EF9F27] shrink-0" />
      <div className="flex-1 bg-[#3A3530] rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-[#EF9F27] h-full rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-5 text-right text-[#9A9490]">{count}</span>
    </div>
  );
}

export default function ReviewsManagement() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterType>("All");
  const [viewTarget, setViewTarget] = useState<ReviewWithCustomer | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await apiFetch("/review", user?.token);
      if (!r.ok) throw new Error();
      const data: ReviewWithCustomer[] = await r.json();
      setReviews(data);
    } catch {
      setError("Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.token]);

  const filtered =
    filter === "All" ? reviews : reviews.filter((r) => r.reviewType === filter);

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : "—";

  const ratingCounts = [5, 4, 3, 2, 1].map((n) => ({
    label: n,
    count: reviews.filter((r) => r.rating === n).length,
  }));

  return (
    <PageWrapper>
      <PageHeader
        title="Customer Reviews"
        subtitle="View all reviews submitted by customers."
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

      {/* Summary cards */}
      {!loading && reviews.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Average rating */}
          <div className="bg-[#1A1815] border border-[#3A3530] rounded-xl p-5">
            <p className="text-xs text-[#9A9490] font-[Syne] font-semibold uppercase tracking-wider mb-2">
              Average Rating
            </p>
            <div className="flex items-end gap-2">
              <span className="font-[Syne] font-extrabold text-3xl text-[#EF9F27]">{avgRating}</span>
              <div className="flex gap-0.5 pb-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={14}
                    fill={n <= Math.round(parseFloat(avgRating || "0")) ? "#EF9F27" : "none"}
                    className={
                      n <= Math.round(parseFloat(avgRating || "0"))
                        ? "text-[#EF9F27]"
                        : "text-[#3A3530]"
                    }
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-[#9A9490] font-[DM_Sans] mt-1">
              Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Rating breakdown */}
          <div className="bg-[#1A1815] border border-[#3A3530] rounded-xl p-5">
            <p className="text-xs text-[#9A9490] font-[Syne] font-semibold uppercase tracking-wider mb-3">
              Rating Breakdown
            </p>
            <div className="space-y-1.5">
              {ratingCounts.map(({ label, count }) => (
                <RatingBar key={label} label={label} count={count} total={reviews.length} />
              ))}
            </div>
          </div>

          {/* Review types */}
          <div className="bg-[#1A1815] border border-[#3A3530] rounded-xl p-5">
            <p className="text-xs text-[#9A9490] font-[Syne] font-semibold uppercase tracking-wider mb-3">
              Review Types
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#C97B4A]/15 rounded-lg">
                    <ShoppingCart size={12} className="text-[#C97B4A]" />
                  </div>
                  <span className="text-sm text-[#EDEAE4] font-[DM_Sans]">Purchase</span>
                </div>
                <span className="font-[Syne] font-bold text-[#C97B4A]">
                  {reviews.filter((r) => r.reviewType === "Purchase").length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#85B7EB]/15 rounded-lg">
                    <Wrench size={12} className="text-[#85B7EB]" />
                  </div>
                  <span className="text-sm text-[#EDEAE4] font-[DM_Sans]">Service</span>
                </div>
                <span className="font-[Syne] font-bold text-[#85B7EB]">
                  {reviews.filter((r) => r.reviewType === "Service").length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6">
        {(["All", "Purchase", "Service"] as FilterType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-[Syne] font-semibold transition-colors border ${
              filter === tab
                ? "bg-[#EF9F27]/15 text-[#EF9F27] border-[#EF9F27]/30"
                : "border-[#3A3530] text-[#9A9490] hover:text-[#EDEAE4] hover:border-[#9A9490]"
            }`}
          >
            {tab === "Purchase" && <ShoppingCart size={11} />}
            {tab === "Service" && <Wrench size={11} />}
            {tab}
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                filter === tab
                  ? "bg-[#EF9F27]/20 text-[#EF9F27]"
                  : "bg-[#3A3530] text-[#9A9490]"
              }`}
            >
              {tab === "All" ? reviews.length : reviews.filter((r) => r.reviewType === tab).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState message="No reviews found." />
      ) : (
        <DataTable>
          <thead>
            <tr>
              <Th>Customer</Th>
              <Th>Type</Th>
              <Th>Subject</Th>
              <Th>Rating</Th>
              <Th>Comment</Th>
              <Th>Date</Th>
              <Th right>View</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((rev) => (
              <TrHover key={rev.id} onClick={() => setViewTarget(rev)}>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#3A3530] rounded-lg shrink-0">
                      <User size={12} className="text-[#9A9490]" />
                    </div>
                    <div>
                      <p className="text-[#EDEAE4] font-medium text-sm">
                        {rev.customerName || `Customer #${rev.customerId}`}
                      </p>
                      {rev.customerEmail && (
                        <p className="text-xs text-[#9A9490]">{rev.customerEmail}</p>
                      )}
                    </div>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`p-1.5 rounded-lg ${
                        rev.reviewType === "Purchase"
                          ? "bg-[#C97B4A]/15"
                          : "bg-[#85B7EB]/15"
                      }`}
                    >
                      {rev.reviewType === "Purchase" ? (
                        <ShoppingCart size={11} className="text-[#C97B4A]" />
                      ) : (
                        <Wrench size={11} className="text-[#85B7EB]" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-[Syne] font-semibold ${
                        rev.reviewType === "Purchase" ? "text-[#C97B4A]" : "text-[#85B7EB]"
                      }`}
                    >
                      {rev.reviewType}
                    </span>
                  </div>
                </Td>
                <Td>
                  <span className="font-medium">{rev.subject}</span>
                </Td>
                <Td>
                  <StarDisplay rating={rev.rating} />
                </Td>
                <Td muted>
                  <span className="line-clamp-1 max-w-xs block text-sm">
                    {rev.comment || <span className="italic text-[#9A9490]/60">No comment</span>}
                  </span>
                </Td>
                <Td muted>{fmtDate(rev.createdAt)}</Td>
                <Td right>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewTarget(rev);
                    }}
                    className="p-1.5 text-[#9A9490] hover:text-[#EDEAE4] transition-colors"
                  >
                    <Eye size={14} />
                  </button>
                </Td>
              </TrHover>
            ))}
          </tbody>
        </DataTable>
      )}

      {/* View review modal */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Review Details">
        {viewTarget && (
          <div className="space-y-4">
            {/* Customer info */}
            <div className="flex items-center gap-3 bg-[#0C0B0A] border border-[#3A3530] rounded-lg p-3">
              <div className="p-2.5 bg-[#3A3530] rounded-full">
                <User size={16} className="text-[#9A9490]" />
              </div>
              <div>
                <p className="text-[#EDEAE4] font-[Syne] font-bold text-sm">
                  {viewTarget.customerName || `Customer #${viewTarget.customerId}`}
                </p>
                {viewTarget.customerEmail && (
                  <p className="text-xs text-[#9A9490] font-[DM_Sans]">{viewTarget.customerEmail}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Review Type", val: viewTarget.reviewType },
                { label: "Date", val: fmtDate(viewTarget.createdAt) },
                ...(viewTarget.referenceId
                  ? [{ label: "Reference ID", val: String(viewTarget.referenceId) }]
                  : []),
              ].map(({ label, val }) => (
                <div key={label}>
                  <p className="text-[#9A9490] text-xs font-[Syne] font-semibold uppercase tracking-wider mb-1">
                    {label}
                  </p>
                  <p className="text-[#EDEAE4]">{val}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[#9A9490] text-xs font-[Syne] font-semibold uppercase tracking-wider mb-1">
                Subject
              </p>
              <p className="text-[#EDEAE4] font-medium">{viewTarget.subject}</p>
            </div>

            <div>
              <p className="text-[#9A9490] text-xs font-[Syne] font-semibold uppercase tracking-wider mb-2">
                Rating
              </p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={18}
                      fill={n <= viewTarget.rating ? "#EF9F27" : "none"}
                      className={n <= viewTarget.rating ? "text-[#EF9F27]" : "text-[#3A3530]"}
                    />
                  ))}
                </div>
                <span className="text-[#EF9F27] font-[Syne] font-bold">{viewTarget.rating}/5</span>
                <span className="text-[#9A9490] text-sm font-[DM_Sans]">
                  {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][viewTarget.rating]}
                </span>
              </div>
            </div>

            {viewTarget.comment && (
              <div>
                <p className="text-[#9A9490] text-xs font-[Syne] font-semibold uppercase tracking-wider mb-1">
                  Comment
                </p>
                <p className="text-sm text-[#EDEAE4] font-[DM_Sans] bg-[#0C0B0A] border border-[#3A3530] rounded-lg p-3 leading-relaxed">
                  {viewTarget.comment}
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-[#3A3530]">
              <button onClick={() => setViewTarget(null)} className={secondaryBtn}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
