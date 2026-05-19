import { Loader2, Inbox } from "lucide-react";

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={size} className="animate-spin text-[#C97B4A]" />
    </div>
  );
}

export function EmptyState({ message = "No data found." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#9A9490]">
      <Inbox size={32} strokeWidth={1.5} />
      <p className="text-sm font-[DM_Sans]">{message}</p>
    </div>
  );
}

export function ErrorMsg({ message }: { message: string }) {
  return (
    <div className="px-4 py-3 bg-[#E24B4A]/10 border border-[#E24B4A]/30 rounded-lg text-[#F09595] text-sm font-[DM_Sans]">
      {message}
    </div>
  );
}

export function SuccessMsg({ message }: { message: string }) {
  return (
    <div className="px-4 py-3 bg-[#1D9E75]/10 border border-[#1D9E75]/30 rounded-lg text-[#5DCAA5] text-sm font-[DM_Sans]">
      {message}
    </div>
  );
}
