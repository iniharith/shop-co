/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { Button } from "@/components/ui/button";
import { Trash2, Pencil, KeyRound, Copy, Check } from "lucide-react";
import { useState } from "react";
import { deleteUser } from "@/api/users";
import { generateMagicLink } from "@/api/auth";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { UserFormModal } from "./UserFormModal";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface CellActionProps {
  data: any;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [loginLink, setLoginLink] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { data: session } = useSession();

  const canGenerateLink = session?.user?.role === "sysadmin" || session?.user?.role === "boss";

  const onConfirm = async () => {
    try {
      setLoading(true);
      if (session?.user?.token) {
        await deleteUser(session?.user?.token, data._id);
        toast.success("User deleted successfully");
        window.location.reload();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const onGenerateLink = async () => {
    if (!session?.user?.token) return;
    setGenerating(true);
    setCopied(false);
    try {
      const res = await generateMagicLink(session.user.token, data._id);
      const fullUrl = `${window.location.origin}/auth/magic?token=${res.token}`;
      setLoginLink(fullUrl);
      setLinkModalOpen(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to generate login link");
    } finally {
      setGenerating(false);
    }
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(loginLink);
      setCopied(true);
      toast.success("Login link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <>
      <div className="flex gap-2">
        {canGenerateLink && (
          <Button disabled={loading || generating} variant="outline" size="icon" onClick={onGenerateLink} title="Generate direct login link">
            {generating ? <KeyRound className="h-4 w-4 animate-pulse" /> : <KeyRound className="h-4 w-4" />}
          </Button>
        )}
        <Button disabled={loading} variant="outline" size="icon" onClick={() => setEditModalOpen(true)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button disabled={loading} variant="destructive" size="icon" onClick={() => {
            if(confirm("Are you sure you want to completely remove this user?")) {
                onConfirm();
            }
        }}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Direct login link</DialogTitle>
            <DialogDescription>
              {data.name} can open this link to sign in without a password. It expires in 7 days.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 py-2">
            <Input readOnly value={loginLink} className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={onCopy} title="Copy link">
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <UserFormModal 
        open={editModalOpen} 
        onOpenChange={setEditModalOpen} 
        initialData={data} 
      />
    </>
  );
};
