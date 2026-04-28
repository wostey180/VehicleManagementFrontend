import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../../components/auth/Logo";
import LeftPanel from "../../components/auth/LeftPanel";
import StrengthBar from "../../components/auth/StrengthBar";

const API = import.meta.env.VITE_API_URL || "https://localhost:7040/api";

const inputClass =
  "w-full bg-[#1A1815] border border-[#3A3530] rounded-lg px-4 py-3 text-sm text-[#EDEAE4] placeholder-[#3A3530] outline-none focus:border-[#C97B4A] transition-colors font-[DM_Sans]";

interface RegisterForm {
  fullName: string;
  email: string;
  password: string;
  role: string;
  phone: string;
  address: string;
}

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterForm>({
    fullName: "",
    email: "",
    password: "",
    role: "Customer",
    phone: "",
    address: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handle = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          const msgs = Object.values(data.errors).flat().join(" ");
          throw new Error(msgs as string);
        }
        throw new Error(data.message || "Registration failed.");
      }
      setSuccess(data.message || "Registration successful! Please check your email.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[#0C0B0A]">
      <LeftPanel
        title="Join"
        highlight="Reviio."
        subtitle="Create your account and start managing parts, sales, and customers with precision."
        features={[
          "Secure email verification on signup",
          "Password protected with lockout safety",
          "Instant access after email confirmation",
        ]}
      />

      <div className="flex items-center justify-center p-8 bg-[#0C0B0A]">
        <div className="w-full max-w-md">
          <Logo />
          <h1 className="font-[Syne] font-bold text-[1.75rem] leading-tight tracking-tight text-[#EDEAE4] mb-1">
            Create account
          </h1>
          <p className="text-sm text-[#9A9490] mb-8">
            Already registered?{" "}
            <Link to="/login" className="text-[#C97B4A] font-medium hover:underline">
              Sign in
            </Link>
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-[#E24B4A]/10 border border-[#E24B4A]/30 text-[#F09595] leading-relaxed">
              {error}
            </div>
          )}

          {success ? (
            <div className="px-4 py-3 rounded-lg text-sm bg-[#1D9E75]/10 border border-[#1D9E75]/30 text-[#5DCAA5] leading-relaxed">
              {success}
              <br />
              <Link to="/login" className="font-medium hover:underline">
                Go to login →
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-[#9A9490] uppercase tracking-widest mb-1.5">
                    Full name
                  </label>
                  <input
                    name="fullName"
                    placeholder="John Doe"
                    value={form.fullName}
                    onChange={handle}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#9A9490] uppercase tracking-widest mb-1.5">
                    Role
                  </label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handle}
                    className={`${inputClass} appearance-none cursor-pointer`}
                  >
                    <option value="Customer">Customer</option>
                    <option value="Staff">Staff</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

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
                    placeholder="Min 6 chars, uppercase, number, symbol"
                    value={form.password}
                    onChange={handle}
                    className={`${inputClass} pr-14`}
                  />
                  <button
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9A9490] hover:text-[#EDEAE4] transition-colors"
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
                <StrengthBar password={form.password} />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-[#9A9490] uppercase tracking-widest mb-1.5">
                    Phone
                  </label>
                  <input
                    name="phone"
                    placeholder="9841000000"
                    value={form.phone}
                    onChange={handle}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#9A9490] uppercase tracking-widest mb-1.5">
                    Address
                  </label>
                  <input
                    name="address"
                    placeholder="Kathmandu"
                    value={form.address}
                    onChange={handle}
                    className={inputClass}
                  />
                </div>
              </div>

              <button
                onClick={submit}
                disabled={loading || !form.fullName || !form.email || !form.password}
                className="w-full mt-2 py-3 bg-[#C97B4A] hover:bg-[#A85E30] disabled:opacity-50 disabled:cursor-not-allowed text-[#0C0B0A] font-[Syne] font-bold text-[0.95rem] tracking-wide rounded-lg transition-colors active:scale-[0.99]"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}