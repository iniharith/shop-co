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

const ProfileCard = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const { profileData, isLoading, updateProfile, isUpdating } = useProfile();

  const [isEditing, setIsEditing] = useState(false);
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
    if (profileData?.data) {
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
    updateProfile(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (profileData?.data) {
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
  const profile = profileData?.data;
  const displayName = profile?.name || session?.user?.name || "";
  const displayEmail = profile?.email || session?.user?.email || "";
  const displayPhone = profile?.phoneNumber || "";
  const displayRole = profile?.role || "Client";
  const displayVerified = profile?.verified || false;
  const displayAvatar = profile?.avatar || null;
  const displayInitial = displayName ? displayName.charAt(0).toUpperCase() : "?";

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 animate-pulse">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gray-200" />
          <div className="flex flex-col gap-3 flex-1">
            <div className="h-6 bg-gray-200 rounded-full w-40" />
            <div className="h-4 bg-gray-100 rounded-full w-56" />
            <div className="h-4 bg-gray-100 rounded-full w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-0 overflow-hidden">

      {/* ── HEADER BANNER ── */}
      <div className="h-24 bg-gradient-to-r from-primary/80 via-primary to-primary/60 relative">
        <div className="absolute bottom-0 right-0 opacity-10 text-[120px] font-black text-white leading-none select-none pr-4">
          KC
        </div>
      </div>

      {/* ── PROFILE MAIN SECTION ── */}
      <div className="px-6 md:px-8 pb-6">
        {/* Avatar — overlapping the banner */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 mb-5">
          <div className="relative w-fit">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-primary shadow-md flex items-center justify-center overflow-hidden">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {displayInitial}
                </span>
              )}
            </div>
            {displayVerified && (
              <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full shadow-md border-2 border-white">
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
                className="gap-2 rounded-full px-5 border-primary text-primary hover:bg-primary hover:text-white transition-all"
              >
                <Edit2 size={15} /> Edit Profile
              </Button>
            )}
            <Button
              onClick={() =>
                signOut().then(() => {
                  toast.success("Logged out successfully");
                  router.push("/");
                })
              }
              variant="destructive"
              className="gap-2 rounded-full px-5"
            >
              <LogOut size={15} /> Logout
            </Button>
          </div>
        </div>

        {/* ── NAME + BADGE ── */}
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold text-gray-900">
              {displayName || "—"}
            </h2>
            {displayVerified && (
              <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                <CheckCircle2 size={11} /> Verified
              </span>
            )}
            <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full capitalize">
              {displayRole}
            </span>
          </div>
        </div>

        {/* ── PROFILE DETAILS GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {/* Email */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Mail size={14} className="text-primary" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Email</p>
              <p className="text-sm font-semibold text-gray-800 truncate">
                {displayEmail || "—"}
              </p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Phone size={14} className="text-primary" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Phone</p>
              <p className="text-sm font-semibold text-gray-800 truncate">
                {displayPhone || (
                  <span className="text-gray-400 italic font-normal">Not added yet</span>
                )}
              </p>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 sm:col-span-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin size={14} className="text-primary" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Delivery Address</p>
              {profile?.address?.street ? (
                <p className="text-sm font-semibold text-gray-800">
                  {profile.address.street}, {profile.address.city},{" "}
                  {profile.address.state} {profile.address.zip},{" "}
                  {profile.address.country}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic font-normal">
                  No address saved — add one to speed up checkout
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── EDIT FORM ── */}
        {isEditing && (
          <div className="pt-6 border-t border-gray-100 animate-in slide-in-from-top-2">
            <h3 className="text-base font-bold mb-4 text-gray-900">Kemaskini Profil</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nama
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-gray-50 focus:bg-white transition-colors"
                />
              </div>
              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nombor Telefon
                </label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  placeholder="+60123456789"
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-gray-50 focus:bg-white transition-colors"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
                  Alamat Penghantaran (EasyParcel)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Street */}
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-xs text-gray-500">Alamat / Street</label>
                    <input
                      type="text"
                      value={formData.address.street}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: { ...formData.address, street: e.target.value },
                        })
                      }
                      className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-gray-50 focus:bg-white transition-colors"
                    />
                  </div>
                  {/* Postcode */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-gray-500">Poskod</label>
                    <input
                      type="text"
                      value={formData.address.zip}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: { ...formData.address, zip: e.target.value },
                        })
                      }
                      className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-gray-50 focus:bg-white transition-colors"
                    />
                  </div>
                  {/* City */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-gray-500">Bandar</label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: { ...formData.address, city: e.target.value },
                        })
                      }
                      className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-gray-50 focus:bg-white transition-colors"
                    />
                  </div>
                  {/* State */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-gray-500">Negeri</label>
                    <input
                      type="text"
                      value={formData.address.state}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: { ...formData.address, state: e.target.value },
                        })
                      }
                      className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-gray-50 focus:bg-white transition-colors"
                    />
                  </div>
                  {/* Country */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-gray-500">Negara</label>
                    <input
                      type="text"
                      value={formData.address.country}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: { ...formData.address, country: e.target.value },
                        })
                      }
                      className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-gray-50 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <Button
                onClick={handleCancel}
                variant="ghost"
                className="gap-2 text-gray-500 rounded-full"
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
