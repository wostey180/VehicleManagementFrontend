interface StatusBadgeProps {
  status: string;
}

const statusMap: Record<string, string> = {
  Pending: "bg-[#EF9F27]/15 text-[#EF9F27] border-[#EF9F27]/30",
  Confirmed: "bg-[#1D9E75]/15 text-[#5DCAA5] border-[#1D9E75]/30",
  Completed: "bg-[#378ADD]/15 text-[#85B7EB] border-[#378ADD]/30",
  Cancelled: "bg-[#E24B4A]/15 text-[#F09595] border-[#E24B4A]/30",
  Active: "bg-[#1D9E75]/15 text-[#5DCAA5] border-[#1D9E75]/30",
  Inactive: "bg-[#3A3530]/50 text-[#9A9490] border-[#3A3530]",
  Paid: "bg-[#1D9E75]/15 text-[#5DCAA5] border-[#1D9E75]/30",
  Unpaid: "bg-[#E24B4A]/15 text-[#F09595] border-[#E24B4A]/30",
  Available: "bg-[#1D9E75]/15 text-[#5DCAA5] border-[#1D9E75]/30",
  Rejected: "bg-[#E24B4A]/15 text-[#F09595] border-[#E24B4A]/30",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const cls = statusMap[status] ?? "bg-[#3A3530]/50 text-[#9A9490] border-[#3A3530]";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${cls}`}>
      {status}
    </span>
  );
}
