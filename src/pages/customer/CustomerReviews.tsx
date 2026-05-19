import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch, fmtCurrency, fmtDate } from "../../utils/api";
import { PageHeader, PageWrapper } from "../../components/shared/PortalLayout";
import { Modal } from "../../components/shared/Modal";
import { Spinner, EmptyState, ErrorMsg, SuccessMsg } from "../../components/shared/Feedback";
import { labelClass, primaryBtn, secondaryBtn, dangerBtn, selectClass, inputClass } from "../../components/shared/formStyles";
import type { Review, CustomerHistoryDto } from "../../types";
import { Star, ShoppingCart, Wrench, Plus, Trash2, MessageSquare } from "lucide-react";

function useCustomerId() {
  return localStorage.getItem("reviio_customerId") || "";
}

// ── Star rating widget ────────────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const interactive = !!onChange;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => interactive && setHovered(n)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={interactive ? "transition-transform hover:scale-110" : "cursor-default"}
        >
          <Star
            size={interactive ? 22 : 14}
            fill={(hovered || value) >= n ? "#EF9F27" : "none"}
            className={(hovered || value) >= n ? "text-[#EF9F27]" : "text-[#3A3530]"}
          />
        </button>
      ))}
      {interactive && value > 0 && (
        <span className="ml-2 text-sm text-[#9A9490] font-[DM_Sans]">
          {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][value]}
        </span>
      )}
    </div>
  );
}

// ── Review card ───────────────────────────────────────────────────────────────
function ReviewCard({ review, onDelete }: { review: Review; onDelete: () => void }) {
  const isPurchase = review.reviewType === "Purchase";
  return (
    <div className="bg-[#1A1815] border border-[#3A3530] rounded-xl p-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg ${isPurchase ? "bg-[#C97B4A]/15" : "bg-[#85B7EB]/15"}`}
          >
            {isPurchase
              ? <ShoppingCart size={13} className="text-[#C97B4A]" />
              : <Wrench size={13} className="text-[#85B7EB]" />}
          </div>
          <div>
            <p className="text-xs font-[Syne] font-bold text-[#EDEAE4]">{review.subject}</p>
            <p className="text-[10px] text-[#9A9490] font-[DM_Sans] mt-0.5">{fmtDate(review.createdAt)}</p>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="p-1.5 text-[#9A9490] hover:text-[#F09595] transition-colors shrink-0"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <StarRating value={review.rating} />

      {review.comment && (
        <p className="text-sm text-[#9A9490] font-[DM_Sans] mt-3 leading-relaxed border-t border-[#3A3530]/50 pt-3">
          "{review.comment}"
        </p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CustomerReviews() {
  const { user } = useAuth();
  const customerId = useCustomerId();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [history, setHistory] = useState<CustomerHistoryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [reviewType, setReviewType] = useState<"Purchase" | "Service">("Purchase");
  const [referenceId, setReferenceId] = useState<string>("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const load = async () => {
    if (!customerId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [rr, hr] = await Promise.all([
        apiFetch(`/review/customer/${customerId}`, user?.token),
        apiFetch(`/customerhistory/${customerId}`, user?.token),
      ]);
      setReviews(await rr.json());
      setHistory(await hr.json());
    } catch { setError("Failed to load reviews."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [customerId, user?.token]);

  // Items to show in the reference dropdown based on chosen type
  const referenceOptions = reviewType === "Purchase"
    ? (history?.purchaseHistory ?? []).map((inv) => ({
        id: String(inv.invoiceId),
        label: `Invoice #${inv.invoiceId} — ${fmtDate(inv.invoiceDate)} — ${fmtCurrency(inv.totalAmount)}`,
        subject: `Invoice #${inv.invoiceId}`,
      }))
    : (history?.serviceHistory ?? []).map((svc) => ({
        id: String(svc.appointmentId),
        label: `${svc.vehicleYear} ${svc.vehicleMake} ${svc.vehicleModel} — ${fmtDate(svc.appointmentDate)} (${svc.status})`,
        subject: `${svc.vehicleYear} ${svc.vehicleMake} ${svc.vehicleModel} service`,
      }));

  // Already-reviewed reference IDs for this type (prevent duplicates)
  const reviewedIds = new Set(
    reviews
      .filter((r) => r.reviewType === reviewType)
      .map((r) => String(r.referenceId))
  );

  const unreviewedOptions = referenceOptions.filter((o) => !reviewedIds.has(o.id));

  const openCreate = () => {
    setReviewType("Purchase");
    setReferenceId("");
    setRating(0);
    setComment("");
    setError("");
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!referenceId) { setError("Please select what you are reviewing."); return; }
    if (rating === 0) { setError("Please select a star rating."); return; }

    const chosen = referenceOptions.find((o) => o.id === referenceId);
    if (!chosen) return;

    setSubmitting(true);
    try {
      const body = {
        customerId: parseInt(customerId, 10),
        reviewType,
        referenceId: parseInt(referenceId, 10),
        subject: chosen.subject,
        rating,
        comment,
      };
      const r = await apiFetch("/review", user?.token, { method: "POST", body: JSON.stringify(body) });
      if (!r.ok) throw new Error("Failed to submit review.");
      flash("Review submitted. Thank you!");
      setCreateOpen(false);
      load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/review/${deleteTarget.id}`, user?.token, { method: "DELETE" });
      flash("Review removed."); setDeleteTarget(null); load();
    } catch { setError("Failed to remove review."); }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const purchaseReviews = reviews.filter((r) => r.reviewType === "Purchase");
  const serviceReviews = reviews.filter((r) => r.reviewType === "Service");

  const hasUnreviewed =
    (history?.purchaseHistory.length ?? 0) > reviewedIds.size ||
    (history?.serviceHistory.length ?? 0) > 0;

  return (
    <PageWrapper>
      <PageHeader
        title="My Reviews"
        subtitle="Rate your purchases and service appointments."
        action={
          <button onClick={openCreate} className={primaryBtn + " flex items-center gap-2"}>
            <Plus size={14} /> Write Review
          </button>
        }
      />

      {error && <div className="mb-4"><ErrorMsg message={error} /></div>}
      {success && <div className="mb-4"><SuccessMsg message={success} /></div>}

      {/* Summary bar */}
      {avgRating && (
        <div className="bg-[#1A1815] border border-[#3A3530] rounded-xl p-5 mb-6 flex items-center gap-5">
          <div className="text-center">
            <p className="font-[Syne] font-extrabold text-4xl text-[#EF9F27]">{avgRating}</p>
            <p className="text-[10px] text-[#9A9490] mt-0.5 font-[DM_Sans]">avg rating</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <StarRating value={Math.round(Number(avgRating))} />
              <span className="text-sm text-[#9A9490] font-[DM_Sans]">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#9A9490] font-[DM_Sans]">
              <span className="flex items-center gap-1"><ShoppingCart size={11} className="text-[#C97B4A]" /> {purchaseReviews.length} purchase</span>
              <span className="flex items-center gap-1"><Wrench size={11} className="text-[#85B7EB]" /> {serviceReviews.length} service</span>
            </div>
          </div>
        </div>
      )}

      {loading ? <Spinner /> : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <MessageSquare size={40} strokeWidth={1.2} className="text-[#3A3530]" />
          <div className="text-center">
            <p className="text-[#EDEAE4] font-[Syne] font-bold mb-1">No reviews yet</p>
            <p className="text-sm text-[#9A9490] font-[DM_Sans]">
              {hasUnreviewed
                ? "You have purchases or services you can review."
                : "Complete a purchase or appointment first."}
            </p>
          </div>
          {hasUnreviewed && (
            <button onClick={openCreate} className={primaryBtn}>Write a Review</button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Purchase reviews */}
          {purchaseReviews.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <ShoppingCart size={13} className="text-[#C97B4A]" />
                <h3 className="font-[Syne] font-bold text-sm text-[#EDEAE4]">Purchase Reviews</h3>
              </div>
              <div className="space-y-3">
                {purchaseReviews.map((r) => (
                  <ReviewCard key={r.id} review={r} onDelete={() => setDeleteTarget(r)} />
                ))}
              </div>
            </section>
          )}

          {/* Service reviews */}
          {serviceReviews.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Wrench size={13} className="text-[#85B7EB]" />
                <h3 className="font-[Syne] font-bold text-sm text-[#EDEAE4]">Service Reviews</h3>
              </div>
              <div className="space-y-3">
                {serviceReviews.map((r) => (
                  <ReviewCard key={r.id} review={r} onDelete={() => setDeleteTarget(r)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Create Review Modal ──────────────────────────────────────────────── */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Write a Review">
        <div className="space-y-5">

          {/* Type toggle */}
          <div>
            <label className={labelClass}>What are you reviewing?</label>
            <div className="flex gap-2 mt-1.5">
              {(["Purchase", "Service"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setReviewType(type); setReferenceId(""); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-[Syne] transition-colors ${
                    reviewType === type
                      ? type === "Purchase"
                        ? "bg-[#C97B4A]/20 text-[#C97B4A] border border-[#C97B4A]/40"
                        : "bg-[#85B7EB]/20 text-[#85B7EB] border border-[#85B7EB]/40"
                      : "border border-[#3A3530] text-[#9A9490] hover:text-[#EDEAE4]"
                  }`}
                >
                  {type === "Purchase" ? <ShoppingCart size={13} /> : <Wrench size={13} />}
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Reference selector */}
          <div>
            <label className={labelClass}>
              Select {reviewType === "Purchase" ? "Invoice" : "Appointment"}
            </label>
            {unreviewedOptions.length === 0 ? (
              <p className="text-sm text-[#9A9490] font-[DM_Sans] mt-1.5">
                {referenceOptions.length === 0
                  ? `No ${reviewType.toLowerCase()} history found.`
                  : `You've already reviewed all your ${reviewType.toLowerCase()}s.`}
              </p>
            ) : (
              <select
                className={selectClass + " mt-1.5"}
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
              >
                <option value="">— Select one —</option>
                {unreviewedOptions.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            )}
          </div>

          {/* Star rating */}
          <div>
            <label className={labelClass}>Rating</label>
            <div className="mt-1.5">
              <StarRating value={rating} onChange={setRating} />
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className={labelClass}>Comment <span className="text-[#9A9490] font-normal">(optional)</span></label>
            <textarea
              className={inputClass + " resize-none h-24 mt-1"}
              placeholder="Tell us about your experience…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-[#F09595] font-[DM_Sans]">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleCreate}
              disabled={submitting || unreviewedOptions.length === 0}
              className={primaryBtn}
            >
              {submitting ? "Submitting…" : "Submit Review"}
            </button>
            <button onClick={() => setCreateOpen(false)} className={secondaryBtn}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm ───────────────────────────────────────────────────── */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Review">
        <p className="text-[#9A9490] text-sm mb-5 font-[DM_Sans]">
          Remove your review for <span className="text-[#EDEAE4] font-medium">{deleteTarget?.subject}</span>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={handleDelete} className={dangerBtn}>Remove</button>
          <button onClick={() => setDeleteTarget(null)} className={secondaryBtn}>Keep It</button>
        </div>
      </Modal>
    </PageWrapper>
  );
}
