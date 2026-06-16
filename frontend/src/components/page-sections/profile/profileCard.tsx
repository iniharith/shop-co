"use client";
import React, { useEffect, useState } from "react";
import { User, Mail, MapPin, Shield, Edit2, LogOut, Save, X, Phone } from "lucide-react";
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
    }
  });

  useEffect(() => {
    if (profileData?.data) {
      setFormData({
        name: profileData.data.name || "",
        phoneNumber: profileData.data.phoneNumber || "",
        address: {
          street: profileData.data.address?.street || "",
          city: profileData.data.address?.city || "",
          state: profileData.data.address?.state || "",
          zip: profileData.data.address?.zip || "",
          country: profileData.data.address?.country || "Malaysia",
        }
      });
    }
  }, [profileData]);

  const handleSave = () => {
    updateProfile(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (profileData?.data) {
      setFormData({
        name: profileData.data.name || "",
        phoneNumber: profileData.data.phoneNumber || "",
        address: {
          street: profileData.data.address?.street || "",
          city: profileData.data.address?.city || "",
          state: profileData.data.address?.state || "",
          zip: profileData.data.address?.zip || "",
          country: profileData.data.address?.country || "Malaysia",
        }
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="w-full bg-gray-50 rounded-lg border-input border-1 py-10 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const profile = profileData?.data;

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 py-6 px-4 md:px-8 flex flex-col gap-6 shadow-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white shadow-md">
              {profile?.avatar ? (
                <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover rounded-full" />
              ) : (
                <User size={40} className="text-gray-400" />
              )}
            </div>
            {profile?.verified && (
              <div className="absolute top-0 right-0 bg-blue-600 text-white p-1 rounded-full shadow-md" title="Verified Account">
                <Shield size={12} />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {profile?.name}
              {profile?.verified && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">Verified</span>
              )}
            </h1>
            <div className="flex flex-col gap-1 mt-2 text-sm text-gray-500">
              <div className="flex items-center gap-2"><Mail size={14} /> {profile?.email}</div>
              {profile?.phoneNumber && <div className="flex items-center gap-2"><Phone size={14} /> {profile.phoneNumber}</div>}
              {profile?.address?.street && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} /> {profile.address.city}, {profile.address.state}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
              <Edit2 size={16} /> Edit Profile
            </Button>
          )}
          <Button
            onClick={() => signOut().then(() => { toast.success("Logged out successfully"); router.push("/"); })}
            variant="destructive" className="gap-2"
          >
            <LogOut size={16} /> Logout
          </Button>
        </div>
      </div>

      {isEditing && (
        <div className="mt-4 pt-6 border-t border-gray-100 animate-in slide-in-from-top-2">
          <h2 className="text-lg font-bold mb-4">Kemaskini Profil</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Nama</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Nombor Telefon</label>
              <input 
                type="text" 
                value={formData.phoneNumber} 
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                placeholder="+60123456789"
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-sm font-bold text-gray-900 mt-2 mb-3">Alamat Penghantaran (EasyParcel)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-medium text-gray-500">Alamat</label>
                  <input 
                    type="text" 
                    value={formData.address.street} 
                    onChange={(e) => setFormData({...formData, address: {...formData.address, street: e.target.value}})}
                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-gray-500">Poskod</label>
                  <input 
                    type="text" 
                    value={formData.address.zip} 
                    onChange={(e) => setFormData({...formData, address: {...formData.address, zip: e.target.value}})}
                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-gray-500">Bandar</label>
                  <input 
                    type="text" 
                    value={formData.address.city} 
                    onChange={(e) => setFormData({...formData, address: {...formData.address, city: e.target.value}})}
                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-gray-500">Negeri</label>
                  <input 
                    type="text" 
                    value={formData.address.state} 
                    onChange={(e) => setFormData({...formData, address: {...formData.address, state: e.target.value}})}
                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <Button onClick={handleCancel} variant="ghost" className="gap-2 text-gray-500">
              <X size={16} /> Batal
            </Button>
            <Button onClick={handleSave} disabled={isUpdating} className="gap-2">
              <Save size={16} /> {isUpdating ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
