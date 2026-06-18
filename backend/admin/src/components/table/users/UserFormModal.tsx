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

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any; // If null, it's create mode
}

export const UserFormModal: React.FC<UserFormModalProps> = ({ open, onOpenChange, initialData }) => {
  const isEditing = !!initialData;
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();

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
    } else if (!initialData && open) {
      setFormData({
        name: "",
        email: "",
        phoneNumber: "",
        role: Roles.ADMIN,
        password: "",
      });
    }
  }, [initialData, open]);

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

    const payload = { ...formData };
    if (isEditing && !payload.password) {
      delete (payload as any).password;
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
          onSuccess: () => {
            toast.success("User updated successfully");
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
        onSuccess: () => {
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
          <DialogTitle>{isEditing ? "Edit User" : "Add New User"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
