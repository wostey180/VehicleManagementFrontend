import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch, fmtDate } from "../../utils/api";
import { PageHeader, PageWrapper } from "../../components/shared/PortalLayout";
import { Modal } from "../../components/shared/Modal";
import { Spinner, ErrorMsg, SuccessMsg } from "../../components/shared/Feedback";
import { inputClass, labelClass, primaryBtn, secondaryBtn, dangerBtn } from "../../components/shared/formStyles";
import { ImageUpload } from "../../components/shared/ImageUpload";
import type { CustomerResponse, VehicleResponse } from "../../types";
import { Car, Plus, Pencil, Trash2, User, MapPin, Phone, Mail, Star, Calendar } from "lucide-react";

function useCustomerId() {
  return localStorage.getItem("reviio_customerId") || "";
}


export default function CustomerProfile() {
  const { user } = useAuth();
  const customerId = useCustomerId();
  const [profile, setProfile] = useState<CustomerResponse | null>(null);
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<VehicleResponse | null>(null);
  const [deleteVehicle, setDeleteVehicle] = useState<VehicleResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Image URLs stored in localStorage (no backend schema change needed)
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [vehicleImages, setVehicleImages] = useState<Record<string, string>>({});

  const [profileForm, setProfileForm] = useState({ fullName: "", phone: "", address: "" });
  const emptyVehicle = { make: "", model: "", year: "", licensePlate: "", vin: "" };
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle);

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const load = async () => {
    const id = localStorage.getItem("reviio_customerId");
    if (!id) { setLoading(false); return; }
    setLoading(true);
    try {
      const [pr, vr] = await Promise.all([
        apiFetch(`/customer/${id}/profile`, user?.token),
        apiFetch(`/customer/${id}/vehicles`, user?.token),
      ]);
      const p = await pr.json();
      setProfile(p);
      if (p.imageUrl) setProfileImageUrl(p.imageUrl);
      setProfileForm({ fullName: p.fullName, phone: p.phone, address: p.address });
      const vs: VehicleResponse[] = await vr.json();
      setVehicles(vs);
      // Load any saved vehicle images
      const imgs: Record<string, string> = {};
        vs.forEach((v) => {
            if (v.imageUrl) imgs[v.id] = v.imageUrl;
        });
      setVehicleImages(imgs);
    } catch { setError("Failed to load profile."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [customerId, user?.token]);

  const saveProfileImage = async (url: string) => {
    setProfileImageUrl(url);
    await apiFetch(`/customer/${customerId}/profile-image`, user?.token, {
        method: "PUT",
        body: JSON.stringify({ imageUrl: url }),
    });
  };

  const saveVehicleImage = async (vehicleId: string, url: string) => {
    setVehicleImages((prev) => ({ ...prev, [vehicleId]: url }));
    await apiFetch(`/customer/${customerId}/vehicles/${vehicleId}/image`, user?.token, {
        method: "PUT",
        body: JSON.stringify({ imageUrl: url }),
    });
};

  const saveProfile = async () => {
    setSubmitting(true);
    try {
      const r = await apiFetch(`/customer/${customerId}/profile`, user?.token, {
        method: "PUT",
        body: JSON.stringify(profileForm),
      });
      if (!r.ok) throw new Error("Failed to update");
      flash("Profile updated."); setEditOpen(false); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSubmitting(false); }
  };

  const addVehicle = async () => {
    setSubmitting(true);
    try {
      const body = { ...vehicleForm, year: parseInt(vehicleForm.year) };
      const r = await apiFetch(`/customer/${customerId}/vehicles`, user?.token, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Failed to add vehicle");
      flash("Vehicle added."); setAddVehicleOpen(false); setVehicleForm(emptyVehicle); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSubmitting(false); }
  };

  const saveVehicle = async () => {
    if (!editVehicle) return;
    setSubmitting(true);
    try {
      const body = { ...vehicleForm, year: parseInt(vehicleForm.year) };
      const r = await apiFetch(`/customer/${customerId}/vehicles/${editVehicle.id}`, user?.token, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Failed to update vehicle");
      flash("Vehicle updated."); setEditVehicle(null); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSubmitting(false); }
  };

  const removeVehicle = async () => {
    if (!deleteVehicle) return;
    try {
      await apiFetch(`/customer/${customerId}/vehicles/${deleteVehicle.id}`, user?.token, { method: "DELETE" });
      flash("Vehicle removed."); setDeleteVehicle(null); load();
    } catch { setError("Failed to remove vehicle."); }
  };

  const vehicleFormJsx = (
    <div className="space-y-3">
      {[
        { label: "Make", key: "make", placeholder: "e.g. Toyota" },
        { label: "Model", key: "model", placeholder: "e.g. Corolla" },
        { label: "Year", key: "year", placeholder: "e.g. 2020" },
        { label: "License Plate", key: "licensePlate", placeholder: "e.g. BA 1 PA 1234" },
        { label: "VIN (optional)", key: "vin", placeholder: "Vehicle Identification Number" },
      ].map(({ label, key, placeholder }) => (
        <div key={key}>
          <label className={labelClass}>{label}</label>
          <input
            type={key === "year" ? "number" : "text"}
            placeholder={placeholder}
            className={inputClass}
            value={(vehicleForm as Record<string, string>)[key]}
            onChange={(e) => setVehicleForm((prev) => ({ ...prev, [key]: e.target.value }))}
          />
        </div>
      ))}
    </div>
  );

  if (!customerId) {
    return (
      <PageWrapper>
        <ErrorMsg message="Customer ID not found. Please log out and log in again." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader title="My Profile" subtitle="Manage your personal information and registered vehicles." />

      {error && <div className="mb-4"><ErrorMsg message={error} /></div>}
      {success && <div className="mb-4"><SuccessMsg message={success} /></div>}

      {loading ? <Spinner /> : (
        <div className="space-y-6 max-w-2xl">

          {/* ── Profile card ──────────────────────────────────────────────── */}
          {profile && (
            <div className="bg-[#1A1815] border border-[#3A3530] rounded-xl overflow-hidden">
              {/* Header banner */}
              <div className="h-24 bg-gradient-to-r from-[#C97B4A]/20 via-[#EF9F27]/10 to-transparent relative">
                <button
                  onClick={() => setEditOpen(true)}
                  className="absolute top-3 right-3 flex items-center gap-1.5 text-xs text-[#9A9490] hover:text-[#EDEAE4] font-[Syne] bg-[#0C0B0A]/60 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Pencil size={11} /> Edit Profile
                </button>
              </div>

              {/* Avatar + info */}
              <div className="px-6 pb-6">
                {/* Avatar overlaps banner */}
                <div className="-mt-12 mb-4 flex items-end gap-4">
                  <div className="ring-4 ring-[#1A1815] rounded-full">
                    <ImageUpload
                      currentUrl={profileImageUrl}
                      folder="profiles"
                      shape="circle"
                      size={88}
                      onUploaded={saveProfileImage}
                      placeholder={<User size={32} className="text-[#3A3530]" />}
                    />
                  </div>
                  <div className="pb-1">
                    <h2 className="font-[Syne] font-bold text-xl text-[#EDEAE4]">{profile.fullName}</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Star size={11} fill="#EF9F27" className="text-[#EF9F27]" />
                      <span className="text-xs text-[#EF9F27] font-[Syne] font-bold">{profile.loyaltyPoints} pts</span>
                    </div>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  {[
                    { icon: Mail, label: "Email", val: profile.email },
                    { icon: Phone, label: "Phone", val: profile.phone || "—" },
                    { icon: MapPin, label: "Address", val: profile.address || "—" },
                    { icon: Calendar, label: "Member Since", val: fmtDate(profile.createdAt) },
                  ].map(({ icon: Icon, label, val }) => (
                    <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-[#0C0B0A]/50">
                      <div className="p-1.5 rounded-md bg-[#3A3530]/40 mt-0.5">
                        <Icon size={13} className="text-[#9A9490]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-[Syne] font-semibold text-[#9A9490] uppercase tracking-wider">{label}</p>
                        <p className="text-sm text-[#EDEAE4] font-[DM_Sans] mt-0.5">{val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Vehicles ──────────────────────────────────────────────────── */}
          <div className="bg-[#1A1815] border border-[#3A3530] rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-[Syne] font-bold text-[#EDEAE4]">My Vehicles</h2>
              <button
                onClick={() => { setVehicleForm(emptyVehicle); setAddVehicleOpen(true); }}
                className="flex items-center gap-1.5 text-xs text-[#C97B4A] hover:text-[#A85E30] font-[Syne] border border-[#C97B4A]/30 hover:border-[#C97B4A]/60 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus size={12} /> Add Vehicle
              </button>
            </div>

            {vehicles.length === 0 ? (
              <div className="text-center py-8">
                <Car size={36} strokeWidth={1} className="text-[#3A3530] mx-auto mb-3" />
                <p className="text-sm text-[#9A9490] font-[DM_Sans]">No vehicles registered yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vehicles.map((v) => (
                  <div key={v.id} className="bg-[#0C0B0A] border border-[#3A3530]/60 rounded-xl overflow-hidden">
                    {/* Vehicle image */}
                    <div className="relative h-36 bg-[#1A1815] flex items-center justify-center">
                      {vehicleImages[v.id] ? (
                        <img src={vehicleImages[v.id]} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover" />
                      ) : (
                        <Car size={40} strokeWidth={1} className="text-[#3A3530]" />
                      )}
                      {/* Image upload overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40">
                        <ImageUpload
                          currentUrl={vehicleImages[v.id]}
                          folder="vehicles"
                          shape="square"
                          size={60}
                          onUploaded={(url) => saveVehicleImage(v.id, url)}
                          placeholder={<Car size={18} />}
                        />
                      </div>
                    </div>

                    {/* Vehicle info */}
                    <div className="p-4">
                      <p className="font-[Syne] font-bold text-[#EDEAE4] text-sm">
                        {v.year} {v.make} {v.model}
                      </p>
                      <p className="text-xs text-[#9A9490] font-[DM_Sans] mt-0.5">
                        {v.licensePlate}{v.vin ? ` · ${v.vin}` : ""}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => {
                            setVehicleForm({ make: v.make, model: v.model, year: String(v.year), licensePlate: v.licensePlate, vin: v.vin });
                            setEditVehicle(v);
                          }}
                          className="flex items-center gap-1 text-xs text-[#9A9490] hover:text-[#EDEAE4] transition-colors font-[DM_Sans]"
                        >
                          <Pencil size={11} /> Edit
                        </button>
                        <span className="text-[#3A3530]">·</span>
                        <button
                          onClick={() => setDeleteVehicle(v)}
                          className="flex items-center gap-1 text-xs text-[#9A9490] hover:text-[#F09595] transition-colors font-[DM_Sans]"
                        >
                          <Trash2 size={11} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile">
        <div className="space-y-4">
          {/* Profile image inside modal too */}
          <div className="flex justify-center pb-2">
            <ImageUpload
              currentUrl={profileImageUrl}
              folder="profiles"
              shape="circle"
              size={80}
              onUploaded={saveProfileImage}
              placeholder={<User size={28} className="text-[#3A3530]" />}
            />
          </div>
          {[
            { label: "Full Name", key: "fullName" },
            { label: "Phone", key: "phone" },
            { label: "Address", key: "address" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className={labelClass}>{label}</label>
              <input
                type="text"
                className={inputClass}
                value={(profileForm as Record<string, string>)[key]}
                onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button onClick={saveProfile} disabled={submitting} className={primaryBtn}>
              {submitting ? "Saving…" : "Save Changes"}
            </button>
            <button onClick={() => setEditOpen(false)} className={secondaryBtn}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Add Vehicle Modal */}
      <Modal open={addVehicleOpen} onClose={() => setAddVehicleOpen(false)} title="Add Vehicle">
        {vehicleFormJsx}
        <div className="flex gap-3 pt-4">
          <button onClick={addVehicle} disabled={submitting} className={primaryBtn}>
            {submitting ? "Adding…" : "Add Vehicle"}
          </button>
          <button onClick={() => setAddVehicleOpen(false)} className={secondaryBtn}>Cancel</button>
        </div>
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal open={!!editVehicle} onClose={() => setEditVehicle(null)} title="Edit Vehicle">
        {vehicleFormJsx}
        <div className="flex gap-3 pt-4">
          <button onClick={saveVehicle} disabled={submitting} className={primaryBtn}>
            {submitting ? "Saving…" : "Save Changes"}
          </button>
          <button onClick={() => setEditVehicle(null)} className={secondaryBtn}>Cancel</button>
        </div>
      </Modal>

      {/* Delete Vehicle Modal */}
      <Modal open={!!deleteVehicle} onClose={() => setDeleteVehicle(null)} title="Remove Vehicle">
        <p className="text-[#9A9490] text-sm mb-5 font-[DM_Sans]">
          Remove <span className="text-[#EDEAE4] font-medium">{deleteVehicle?.year} {deleteVehicle?.make} {deleteVehicle?.model}</span>?
        </p>
        <div className="flex gap-3">
          <button onClick={removeVehicle} className={dangerBtn}>Remove</button>
          <button onClick={() => setDeleteVehicle(null)} className={secondaryBtn}>Cancel</button>
        </div>
      </Modal>
    </PageWrapper>
  );
}
