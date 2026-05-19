import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Logo from "../../components/auth/Logo";

const API = import.meta.env.VITE_API_URL || "https://localhost:7040/api";

type Status = "idle" | "loading" | "success" | "error";

const inputClass =
  "w-full bg-[#1A1815] border border-[#3A3530] rounded-lg px-4 py-3 text-sm text-[#EDEAE4] placeholder-[#3A3530] outline-none focus:border-[#C97B4A] transition-colors";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
      verify(urlToken);
    }
  }, []);

  const verify = async (t?: string) => {
    const useToken = t || token;
    if (!useToken.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch(
        `${API}/auth/verify-email?token=${encodeURIComponent(useToken.trim())}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Verification failed.");
      setStatus("success");
      setMessage(data.message);
    } catch (e: any) {
      setStatus("error");
      setMessage(e.message);
    }
  };

  const iconMap = {
    idle: {
      bg: "bg-[#C97B4A]/10 border border-[#C97B4A]/30",
      symbol: "✉",
      color: "text-[#C97B4A]",
    },
    loading: {
      bg: "bg-[#C97B4A]/10 border border-[#C97B4A]/30",
      symbol: "⏳",
      color: "text-[#C97B4A]",
    },
    success: {
      bg: "bg-[#1D9E75]/10 border border-[#1D9E75]/30",
      symbol: "✓",
      color: "text-[#5DCAA5]",
    },
    error: {
      bg: "bg-[#E24B4A]/10 border border-[#E24B4A]/30",
      symbol: "✕",
      color: "text-[#F09595]",
    },
  };

  const icon = iconMap[status];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0C0B0A] p-8">
      <div className="w-full max-w-md bg-[#1A1815] border border-[#3A3530] rounded-2xl px-10 py-12 text-center">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>

        <div
          className={`w-18 h-18 rounded-full mx-auto mb-6 flex items-center justify-center text-2xl ${icon.bg} ${icon.color}`}
          style={{ width: 72, height: 72 }}
        >
          {icon.symbol}
        </div>

        {status === "idle" && (
          <>
            <h2 className="font-[Syne] font-bold text-2xl text-[#EDEAE4] mb-3 tracking-tight">
              Verify your email
            </h2>
            <p className="text-sm text-[#9A9490] leading-relaxed mb-6">
              Check your inbox for the verification link. Paste the token below
              or click the link directly from your email.
            </p>
            <div className="text-left mb-4">
              <label className="block text-xs font-medium text-[#9A9490] uppercase tracking-widest mb-1.5">
                Verification token
              </label>
              <input
                placeholder="Paste token from your email link"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verify()}
                className={inputClass}
              />
            </div>
            <button
              onClick={() => verify()}
              disabled={!token.trim()}
              className="w-full py-3 bg-[#C97B4A] hover:bg-[#A85E30] disabled:opacity-50 disabled:cursor-not-allowed text-[#0C0B0A] font-[Syne] font-bold tracking-wide rounded-lg transition-colors"
            >
              Verify email
            </button>
          </>
        )}

        {status === "loading" && (
          <>
            <h2 className="font-[Syne] font-bold text-2xl text-[#EDEAE4] mb-3 tracking-tight">
              Verifying...
            </h2>
            <p className="text-sm text-[#9A9490] leading-relaxed">
              Please wait while we confirm your email.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <h2 className="font-[Syne] font-bold text-2xl text-[#EDEAE4] mb-3 tracking-tight">
              Email verified!
              {/* Verification */}
            </h2>
            <p className="text-sm text-[#9A9490] leading-relaxed mb-6">
              {message}
            </p>
            <Link
              to="/login"
              className="block w-full py-3 bg-[#C97B4A] hover:bg-[#A85E30] text-[#0C0B0A] font-[Syne] font-bold tracking-wide rounded-lg transition-colors text-center no-underline"
            >
              Go to login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <h2 className="font-[Syne] font-bold text-2xl text-[#EDEAE4] mb-3 tracking-tight">
              Verification failed
            </h2>
            <p className="text-sm text-[#9A9490] leading-relaxed mb-6">
              {message}
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="w-full py-3 bg-[#C97B4A] hover:bg-[#A85E30] text-[#0C0B0A] font-[Syne] font-bold tracking-wide rounded-lg transition-colors"
            >
              Try again
            </button>
          </>
        )}

        <hr className="border-[#3A3530] my-6" />
        <p className="text-sm text-[#9A9490]">
          <Link to="/login" className="text-[#C97B4A] font-medium hover:underline">
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}