"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import AxiosInstance from "@/utils/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [themeBg, setThemeBg] = useState<string>("");

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        email: session.user.email || "",
      });
      setAvatarPreview((session.user as any).avatar || null);
      const storedTheme = localStorage.getItem(`theme-bg-${session.user.id}`);
      if (storedTheme) {
        setThemeBg(storedTheme);
      }
    }
  }, [session]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile || !session?.user?.token) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      
      const res = await AxiosInstance(session.user.token).post(`/api/user/profile/avatar`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      toast.success("Avatar uploaded successfully");
      setAvatarFile(null);
      // Optional: trigger session update
      await update({ avatar: res.data?.avatarUrl });
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload avatar");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleThemeBgChange = (value: string) => {
    setThemeBg(value);
    if (session?.user?.id) {
      if (value) {
        localStorage.setItem(`theme-bg-${session.user.id}`, value);
        window.dispatchEvent(new CustomEvent('theme-bg-changed', { detail: value }));
      } else {
        localStorage.removeItem(`theme-bg-${session.user.id}`);
        window.dispatchEvent(new CustomEvent('theme-bg-changed', { detail: null }));
      }
      toast.success("Background updated!");
    }
  };

  const handleBgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && session?.user?.token) {
      const file = e.target.files[0];
      try {
        setUploading(true);
        const formData = new FormData();
        formData.append("files", file); // use the generic file upload endpoint
        formData.append("category", "UI_BACKGROUND"); // Hide from Artworks
        
        const res = await AxiosInstance(session.user.token).post(`/api/files/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        
        if (res.data?.success && res.data.data && res.data.data.length > 0) {
           const uploadedFile = res.data.data[0];
           const fileUrl = uploadedFile.path.startsWith("http") ? uploadedFile.path : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/files/download/${uploadedFile.path}`;
           handleThemeBgChange(fileUrl);
           if (session?.user?.id) {
             localStorage.setItem(`theme-bg-id-${session.user.id}`, uploadedFile._id);
           }
        } else {
           toast.error("Failed to upload background image");
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to upload background image");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleRemoveBgImage = async () => {
    const fileId = session?.user?.id ? localStorage.getItem(`theme-bg-id-${session.user.id}`) : null;
    if (fileId && session?.user?.token) {
      try {
        await AxiosInstance(session.user.token).delete(`/api/files/${fileId}`);
      } catch (e) {
        console.error("Failed to delete background file", e);
      }
    }
    if (session?.user?.id) {
      localStorage.removeItem(`theme-bg-id-${session.user.id}`);
    }
    handleThemeBgChange("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.token) return;

    try {
      setLoading(true);
      const res = await AxiosInstance(session.user.token).put(`/api/user/profile`, formData);
      toast.success("Profile updated successfully");
      await update({ name: formData.name, email: formData.email });
      
      if (avatarFile) {
        await handleUploadAvatar();
      } else {
        window.location.reload();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Update your personal information and avatar.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center gap-4 mb-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarPreview || ""} />
                  <AvatarFallback>{formData.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex items-center justify-center">
                  <Label htmlFor="profile-avatar" className="cursor-pointer text-sm font-medium text-primary hover:underline">
                    Change Avatar
                  </Label>
                  <Input
                    id="profile-avatar"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>

              <Button type="submit" disabled={loading || uploading} className="w-full">
                {loading || uploading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>UI Settings</CardTitle>
            <CardDescription>Personalize your dashboard appearance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Global Background Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={themeBg && !themeBg.startsWith("http") && !themeBg.startsWith("data:") ? themeBg : "#ffffff"}
                  onChange={(e) => handleThemeBgChange(e.target.value)}
                  className="w-16 p-1 h-10"
                />
                <Button variant="outline" onClick={() => handleThemeBgChange("")}>
                  Reset Color
                </Button>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label>Global Background Image</Label>
              <p className="text-xs text-muted-foreground mb-2">Upload an image to use as your dashboard background.</p>
              <div className="flex items-center gap-4">
                <Label htmlFor="bg-image-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    {uploading ? "Uploading..." : "Upload Image"}
                  </div>
                </Label>
                <Input
                  id="bg-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBgImageUpload}
                  disabled={uploading}
                />
              </div>
              {(themeBg && (themeBg.startsWith("http") || themeBg.startsWith("data:"))) && (
                <div className="mt-4 flex flex-col gap-3">
                  <div className="relative w-40 h-24 rounded-md overflow-hidden border shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={themeBg} alt="Background Preview" className="w-full h-full object-cover" />
                  </div>
                  <Button variant="outline" className="w-40 text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50" onClick={handleRemoveBgImage}>
                    Delete Background
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
