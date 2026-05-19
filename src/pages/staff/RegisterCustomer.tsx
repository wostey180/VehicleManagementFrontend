import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch } from "../../utils/api";
import { PageHeader, PageWrapper } from "../../components/shared/PortalLayout";
import { ErrorMsg, SuccessMsg } from "../../components/shared/Feedback";
import { inputClass, labelClass, primaryBtn, secondaryBtn } from "../../components/shared/formStyles";
import { User, Car } from "lucide-react";

// ── Field must be defined OUTSIDE RegisterCustomer so React doesn't treat it
// as a new component on every keystroke, which causes the cursor-loss bug.
function Field({
  label, value, onChange, type = "text", placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className={inputClass}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

const emptyForm = {
  fullName: "", email: "", password: "", phone: "", address: "",
  make: "", model: "", year: "", licensePlate: "", vin: "",
};

export default function RegisterCustomer() {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const set = (key: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async () => {
    setError(""); setSuccess(""); setSubmitting(true);
    try {
      const body = { ...form, year: parseInt(form.year) };
      const r = await apiFetch("/customer/staff-register", user?.token, {
        method: "POST", body: JSON.stringify(body),
      });
      if (!r.ok) {
        const e = await r.json();
        throw new Error(e?.message || "Registration failed");
      }
      setSuccess("Customer registered successfully with vehicle details.");
      setForm(emptyForm);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSubmitting(false); }
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Register New Customer"
        subtitle="Create a new customer account and add their vehicle details."
      />

      <div className="max-w-2xl space-y-6">
        {error && <ErrorMsg message={error} />}
        {success && <SuccessMsg message={success} />}

        {/* Customer Info */}
        <div className="bg-[#1A1815] border border-[#3A3530] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-[#378ADD]/15 rounded-lg">
              <User size={15} className="text-[#85B7EB]" />
            </div>
            <h2 className="font-[Syne] font-bold text-[#EDEAE4]">Customer Information</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name"  value={form.fullName}  onChange={set("fullName")} />
            <Field label="Email"      value={form.email}     onChange={set("email")}    type="email" />
            <Field label="Password"   value={form.password}  onChange={set("password")} type="password" />
            <Field label="Phone"      value={form.phone}     onChange={set("phone")} />
            <div className="col-span-2">
              <Field label="Address"  value={form.address}   onChange={set("address")} />
            </div>
          </div>
        </div>

        {/* Vehicle Info */}
        <div className="bg-[#1A1815] border border-[#3A3530] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-[#1D9E75]/15 rounded-lg">
              <Car size={15} className="text-[#5DCAA5]" />
            </div>
            <h2 className="font-[Syne] font-bold text-[#EDEAE4]">Vehicle Details</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Make"          value={form.make}         onChange={set("make")}         placeholder="e.g. Toyota" />
            <Field label="Model"         value={form.model}        onChange={set("model")}        placeholder="e.g. Corolla" />
            <Field label="Year"          value={form.year}         onChange={set("year")}         type="number" placeholder="e.g. 2020" />
            <Field label="License Plate" value={form.licensePlate} onChange={set("licensePlate")} placeholder="e.g. BA 1 PA 1234" />
            <div className="col-span-2">
              <Field label="VIN (optional)" value={form.vin}       onChange={set("vin")}          placeholder="Vehicle Identification Number" />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleSubmit} disabled={submitting} className={primaryBtn}>
            {submitting ? "Registering…" : "Register Customer"}
          </button>
          <button onClick={() => setForm(emptyForm)} className={secondaryBtn}>
            Clear
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}