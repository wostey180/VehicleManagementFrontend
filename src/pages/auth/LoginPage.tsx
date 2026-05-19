import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Logo from "../../components/auth/Logo";
import LeftPanel from "../../components/auth/LeftPanel";

const API = import.meta.env.VITE_API_URL || "https://localhost:7040/api";

const roleRedirect: Record<string, string> = {
  Admin: "/admin",
  Staff: "/staff",
  Customer: "/customer",
};

const inputClass =
  "w-full bg-[#1A1815] border border-[#3A3530] rounded-lg px-4 py-3 text-sm text-[#EDEAE4] placeholder-[#3A3530] outline-none focus:border-[#C97B4A] transition-colors font-[DM_Sans]";

export default function LoginPage() {
  const { loginWithResponse } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed.");
      await loginWithResponse(data);
      navigate(roleRedirect[data.role] || "/customer", { replace: true });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[#0C0B0A]">
      <LeftPanel
        title="Welcome"
        highlight="back."
        subtitle="Sign in to manage inventory, sales, and customer relationships — all in one place."
        features={[
          "Role-based access for Admin, Staff & Customers",
          "Real-time parts inventory management",
          "Sales invoices with loyalty discounts",
        ]}
      />

      <div className="flex items-center justify-center p-8 bg-[#0C0B0A]">
        <div className="w-full max-w-md">
          {/* logo */}
          <Logo />
          <h1 className="font-[Syne] font-bold text-[1.75rem] leading-tight tracking-tight text-[#EDEAE4] mb-1">
            Sign in
          </h1>
          <p className="text-sm text-[#9A9490] mb-8">
            Don't have an account?{" "}
            <Link to="/register" className="text-[#C97B4A] font-medium hover:underline">
              Create one
            </Link>
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-[#E24B4A]/10 border border-[#E24B4A]/30 text-[#F09595] leading-relaxed">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-medium text-[#9A9490] uppercase tracking-widest mb-1.5">
              Email address
            </label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handle}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className={inputClass}
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-[#9A9490] uppercase tracking-widest mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={handle}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                className={`${inputClass} pr-14`}
              />
              <button
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9A9490] hover:text-[#EDEAE4] transition-colors"
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            onClick={submit}
            disabled={loading || !form.email || !form.password}
            className="w-full mt-2 py-3 bg-[#C97B4A] hover:bg-[#A85E30] disabled:opacity-50 disabled:cursor-not-allowed text-[#0C0B0A] font-[Syne] font-bold text-[0.95rem] tracking-wide rounded-lg transition-colors active:scale-[0.99]"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <hr className="border-[#3A3530] my-6" />
          <p className="text-center text-sm text-[#9A9490]">
            Need to verify your email?{" "}
            <Link to="/verify-email" className="text-[#C97B4A] font-medium hover:underline">
              Verify here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}