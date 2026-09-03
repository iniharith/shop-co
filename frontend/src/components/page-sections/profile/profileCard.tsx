/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  MapPin,
  Shield,
  Edit2,
  LogOut,
  Save,
  X,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "nextjs-toploader/app";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const ProfileCard = () => {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const { profileData, isLoading, updateProfile, isUpdating } = useProfile() as any;

  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    address: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "Malaysia",
    },
  });

  // Populate form when profile loads
  useEffect(() => {
    if ((profileData as any)?.data) {
      setFormData({
        name: profileData.data.name || session?.user?.name || "",
        phoneNumber: profileData.data.phoneNumber || "",
        address: {
          street: profileData.data.address?.street || "",
          city: profileData.data.address?.city || "",
          state: profileData.data.address?.state || "",
          zip: profileData.data.address?.zip || "",
          country: profileData.data.address?.country || "Malaysia",
        },
      });
    } else if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        name: session.user.name || "",
      }));
    }
  }, [profileData, session]);

  const handleSave = () => {
    if (!formData.phoneNumber) {
      toast.error("Nombor Telefon tidak boleh kosong. (Phone Number is required)");
      return;
    }
    
    if (!formData.address.street || !formData.address.city || !formData.address.state || !formData.address.zip) {
      toast.error("Alamat penuh diperlukan. (Full address is required)");
      return;
    }
    
    updateProfile(formData);
    setIsEditing(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingAvatar(true);
    const token = session?.user?.token;
    const uploadData = new FormData();
    uploadData.append("avatar", file);

    try {
      const res = await fetch(`${API}/api/user/profile/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: uploadData
      });
      const data = await res.json();
      if (data.success) {
        await updateSession({ avatar: data.avatarUrl });
        toast.success("Gambar profil berjaya ditukar!");
        window.location.reload(); 
      } else {
        toast.error(data.message || "Gagal menukar gambar profil");
      }
    } catch (err) {
      toast.error("Ralat memuat naik gambar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCancel = () => {
    if ((profileData as any)?.data) {
      setFormData({
        name: profileData.data.name || session?.user?.name || "",
        phoneNumber: profileData.data.phoneNumber || "",
        address: {
          street: profileData.data.address?.street || "",
          city: profileData.data.address?.city || "",
          state: profileData.data.address?.state || "",
          zip: profileData.data.address?.zip || "",
          country: profileData.data.address?.country || "Malaysia",
        },
      });
    }
    setIsEditing(false);
  };

  // Use API data with session as fallback
  const profile = (profileData as any)?.data;
  const displayName = profile?.name || session?.user?.name || "";
  const displayEmail = profile?.email || session?.user?.email || "";
  const displayPhone = profile?.phoneNumber || "";
  const displayRole = profile?.role || "Client";
  const displayVerified = profile?.verified || false;
  
  let displayAvatar = profile?.avatar || null;
  if (displayAvatar && displayAvatar.startsWith('http')) {
    displayAvatar = displayAvatar.replace('http://', 'https://');
  } else if (displayAvatar && !displayAvatar.startsWith('http')) {
    displayAvatar = `${API}/${displayAvatar.replace(/\\/g, '/').replace(/^\/?/, '')}`;
  }
  
  const displayInitial = displayName ? displayName.charAt(0).toUpperCase() : "?";

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="w-full rounded-3xl border border-white/10 bg-[#151a1d] p-8 shadow-2xl animate-pulse">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-white/10" />
          <div className="flex flex-col gap-3 flex-1">
            <div className="h-6 w-40 rounded-full bg-white/10" />
            <div className="h-4 w-56 rounded-full bg-white/5" />
            <div className="h-4 w-32 rounded-full bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-[#151a1d] shadow-2xl shadow-black/20">

      {/* ── HEADER BANNER ── */}
      <div className="relative h-32 bg-[radial-gradient(circle_at_80%_20%,rgba(214,162,29,0.42),transparent_30%),linear-gradient(120deg,#252b2d,#111517)]">
        <div className="absolute bottom-0 right-0 select-none pr-4 text-[120px] font-black leading-none text-[#f2c14e]/10">
          KC
        </div>
      </div>

      {/* ── PROFILE MAIN SECTION ── */}
      <div className="px-6 md:px-8 pb-6">
        {/* Avatar — overlapping the banner */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 mb-5">
          <div className="relative w-fit">
            <input
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleAvatarChange}
            />
            <button type="button" aria-label="Change profile photo / Tukar gambar profil" className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-[#151a1d] bg-[#d6a21d] shadow-xl" onClick={() => fileInputRef.current?.click()}>
              {isUploadingAvatar && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                </div>
              )}
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Edit2 size={20} className="text-white" />
              </div>
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-[#111517]">
                  {displayInitial}
                </span>
              )}
            </button>
            {displayVerified && (
              <div className="absolute bottom-0 right-0 rounded-full border-2 border-[#151a1d] bg-[#d6a21d] p-1 text-[#111517] shadow-md">
                <Shield size={12} />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 sm:mb-1">
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                 variant="outline"
                 className="gap-2 rounded-full border-[#d6a21d]/60 px-5 text-[#f2c14e] hover:bg-[#d6a21d] hover:text-[#111517]"
              >
                <Edit2 size={15} /> Edit Profile
              </Button>
            )}
            <Button
              onClick={() => {
                signOut({ callbackUrl: "/" });
              }}
               variant="destructive"
               className="gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-5 text-red-200 hover:bg-red-500/20"
            >
              <LogOut size={15} /> Logout
            </Button>
          </div>
        </div>

        {/* ── NAME + BADGE ── */}
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold text-white">
              {displayName || "—"}
            </h2>
            {displayVerified && (
              <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                <CheckCircle2 size={11} /> Verified
              </span>
            )}
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold capitalize text-white/60">
              {displayRole}
            </span>
          </div>
        </div>

        {/* ── PROFILE DETAILS GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {/* Email */}
           <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3">
             <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d6a21d]/15">
               <Mail size={14} className="text-[#f2c14e]" />
            </div>
            <div className="overflow-hidden">
               <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">Email / E-mel</p>
               <p className="truncate text-sm font-semibold text-white/85">
                {displayEmail || "—"}
              </p>
            </div>
          </div>

          {/* Phone */}
           <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3">
             <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d6a21d]/15">
               <Phone size={14} className="text-[#f2c14e]" />
            </div>
            <div className="overflow-hidden">
               <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">Phone / Telefon</p>
               <p className="truncate text-sm font-semibold text-white/85">
                {displayPhone || (
                   <span className="font-normal italic text-white/35">Not added yet / Belum ditambah</span>
                )}
              </p>
            </div>
          </div>

          {/* Address */}
           <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 sm:col-span-2">
             <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d6a21d]/15">
               <MapPin size={14} className="text-[#f2c14e]" />
            </div>
            <div className="overflow-hidden">
               <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">Delivery address / Alamat penghantaran</p>
              {profile?.address?.street ? (
                 <p className="text-sm font-semibold text-white/85">
                  {profile.address.street}, {profile.address.city},{" "}
                  {profile.address.state} {profile.address.zip},{" "}
                  {profile.address.country}
                </p>
              ) : (
                 <p className="font-normal italic text-white/35">
                   No address saved / Tiada alamat — add one to speed up checkout
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── EDIT FORM ── */}
        {isEditing && (
          <div className="animate-in slide-in-from-top-2 border-t border-white/10 pt-6">
             <h3 className="mb-1 text-base font-bold text-white">Edit profile / Kemaskini profil</h3>
             <p className="mb-4 text-xs text-white/45">Keep your contact and delivery details ready for checkout.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                   <label className="text-xs font-semibold uppercase tracking-wider text-white/60">
                   Name / Nama
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                   className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#d6a21d] focus:bg-white/10 focus:ring-2 focus:ring-[#d6a21d]/20"
                />
              </div>
              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                   <label className="text-xs font-semibold uppercase tracking-wider text-white/60">
                   Phone / Nombor telefon
                </label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  placeholder="+60123456789"
                   className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#d6a21d] focus:bg-white/10 focus:ring-2 focus:ring-[#d6a21d]/20"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                 <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/60">
                   Delivery address / Alamat penghantaran (EasyParcel)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Street */}
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                     <label className="text-xs text-white/45">Street / Alamat</label>
                    <input
                      type="text"
                      value={formData.address.street}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: { ...formData.address, street: e.target.value },
                        })
                      }
                       className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#d6a21d] focus:bg-white/10 focus:ring-2 focus:ring-[#d6a21d]/20"
                    />
                  </div>
                  {/* Postcode */}
                  <div className="flex flex-col gap-1.5">
                     <label className="text-xs text-white/45">Postcode / Poskod</label>
                    <input
                      type="text"
                      value={formData.address.zip}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: { ...formData.address, zip: e.target.value },
                        })
                      }
                       className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#d6a21d] focus:bg-white/10 focus:ring-2 focus:ring-[#d6a21d]/20"
                    />
                  </div>
                  {/* City */}
                  <div className="flex flex-col gap-1.5">
                     <label className="text-xs text-white/45">City / Bandar</label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: { ...formData.address, city: e.target.value },
                        })
                      }
                       className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#d6a21d] focus:bg-white/10 focus:ring-2 focus:ring-[#d6a21d]/20"
                    />
                  </div>
                  {/* State */}
                  <div className="flex flex-col gap-1.5">
                     <label className="text-xs text-white/45">State / Negeri</label>
                    <input
                      type="text"
                      value={formData.address.state}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: { ...formData.address, state: e.target.value },
                        })
                      }
                       className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#d6a21d] focus:bg-white/10 focus:ring-2 focus:ring-[#d6a21d]/20"
                    />
                  </div>
                  {/* Country */}
                  <div className="flex flex-col gap-1.5">
                     <label className="text-xs text-white/45">Country / Negara</label>
                    <input
                      type="text"
                      value={formData.address.country}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: { ...formData.address, country: e.target.value },
                        })
                      }
                       className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#d6a21d] focus:bg-white/10 focus:ring-2 focus:ring-[#d6a21d]/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <Button
                onClick={handleCancel}
                variant="ghost"
                 className="gap-2 rounded-full text-white/55 hover:bg-white/5 hover:text-white"
              >
                <X size={15} /> Batal
              </Button>
              <Button
                onClick={handleSave}
                disabled={isUpdating}
                className="gap-2 rounded-full px-6"
              >
                <Save size={15} />{" "}
                {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
