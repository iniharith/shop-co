/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateUser, useUpdateUser } from "@/hooks/useUsers";
import { toast } from "sonner";
import { Roles } from "./columns";
import { useSession } from "next-auth/react";
import { uploadUserAvatar } from "@/api/users";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const PREDEFINED_AVATARS = [
  "Ahmad", "Siti", "Ali", "Aisyah", "Muthu", "MeiLing", 
  "Farid", "Nurul", "Chong", "Devi", "Amir", "Fatima"
].map(seed => `https://api.dicebear.com/7.x/micah/svg?seed=${seed}`);

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any; // If null, it's create mode
}

export const UserFormModal: React.FC<UserFormModalProps> = ({ open, onOpenChange, initialData }) => {
  const isEditing = !!initialData;
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { data: session, update } = useSession();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    role: Roles.ADMIN as string,
    password: "",
  });

  useEffect(() => {
    if (initialData && open) {
      setFormData({
        name: initialData.name || "",
        email: initialData.email || "",
        phoneNumber: initialData.phoneNumber || "",
        role: initialData.role || Roles.ADMIN,
        password: "", // Leave blank unless changing
      });
      setAvatarPreview(initialData.avatar || null);
      setAvatarFile(null);
    } else if (!initialData && open) {
      setFormData({
        name: "",
        email: "",
        phoneNumber: "",
        role: Roles.ADMIN,
        password: "",
      });
      setAvatarPreview(null);
      setAvatarFile(null);
    }
  }, [initialData, open]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadAvatar = async (userId: string) => {
    if (!avatarFile || !session?.user?.token) return;
    try {
      setIsUploadingAvatar(true);
      await uploadUserAvatar(session.user.token, userId, avatarFile);
      toast.success("Avatar uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload avatar");
      console.error(error);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error("Name and email are required");
      return;
    }

    if (!isEditing && !formData.password) {
      toast.error("Password is required for new users");
      return;
    }

    const payload: any = { ...formData };
    if (isEditing && !payload.password) {
      delete payload.password;
    }

    if (avatarPreview && avatarPreview.startsWith("https://api.dicebear.com") && !avatarFile) {
      payload.avatar = avatarPreview;
    }

    if (isEditing) {
      const targetId = initialData._id || initialData.id;
      if (!targetId) {
        toast.error("User ID is missing! Cannot update.");
        return;
      }
      updateUser(
        { id: targetId, data: payload },
        {
          onSuccess: async () => {
            if (avatarFile) {
              await handleUploadAvatar(targetId);
            }
            toast.success("User updated successfully");
            
            // Sync session if the updated user is the currently logged-in user
            if (session?.user?.id === targetId) {
              await update({ 
                name: payload.name, 
                email: payload.email,
                ...(payload.avatar ? { avatar: payload.avatar } : {})
              });
            }
            
            onOpenChange(false);
            window.location.reload();
          },
          onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update user");
          }
        }
      );
    } else {
      createUser(payload, {
        onSuccess: async (data: any) => {
          // If the API returns the created user object in `data.user` or `data`
          const newUserId = data?.user?._id || data?._id || data?.id;
          if (avatarFile && newUserId) {
            await handleUploadAvatar(newUserId);
          }
          toast.success("User created successfully");
          onOpenChange(false);
          window.location.reload();
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || "Failed to create user");
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Pencil User" : "Add New User"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="flex flex-col items-center gap-4 mb-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarPreview || ""} />
              <AvatarFallback>{formData.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex items-center justify-center">
              <Label htmlFor="avatar-upload" className="cursor-pointer text-sm text-primary hover:underline">
                {isEditing ? "Change Avatar" : "Upload Avatar"}
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          <div className="space-y-3 pb-2">
            <Label className="text-center block w-full text-muted-foreground text-xs uppercase tracking-wider">Or Choose a 3D Avatar</Label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-2">
              {PREDEFINED_AVATARS.map((url, i) => (
                <div 
                  key={i} 
                  className={`cursor-pointer rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${avatarPreview === url ? 'border-primary shadow-md scale-110' : 'border-transparent bg-muted/30 hover:border-primary/50'}`}
                  onClick={() => {
                    setAvatarPreview(url);
                    setAvatarFile(null);
                  }}
                >
                  <img src={url} alt={`Avatar ${i+1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Name</Label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              placeholder="Full Name" 
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input 
              type="email" 
              value={formData.email} 
              onChange={e => setFormData({ ...formData, email: e.target.value })} 
              placeholder="email@example.com" 
            />
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input 
              value={formData.phoneNumber} 
              onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} 
              placeholder="e.g. 60123456789" 
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Roles.SYSADMIN}>Sysadmin</SelectItem>
                <SelectItem value={Roles.ADMIN}>Admin</SelectItem>
                <SelectItem value={Roles.DESIGNER}>Designer</SelectItem>
                <SelectItem value={Roles.BOSS}>Boss</SelectItem>
                <SelectItem value={Roles.PRODUCTION}>Production</SelectItem>
                <SelectItem value={Roles.PACKAGING}>Packaging</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Password {isEditing && <span className="text-muted-foreground text-xs">(Leave blank to keep unchanged)</span>}</Label>
            <Input 
              type="password" 
              value={formData.password} 
              onChange={e => setFormData({ ...formData, password: e.target.value })} 
              placeholder="••••••••" 
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isCreating || isUpdating || isUploadingAvatar}>
              {isCreating || isUpdating || isUploadingAvatar ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
