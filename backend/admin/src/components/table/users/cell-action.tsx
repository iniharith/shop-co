"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteUser } from "@/api/users";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface CellActionProps {
  data: any;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  const onConfirm = async () => {
    try {
      setLoading(true);
      if (session?.user?.token) {
        await deleteUser(session.user.token, data._id);
        toast.success("User deleted successfully");
        window.location.reload();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button disabled={loading} variant="destructive" size="icon" onClick={() => {
        if(confirm("Are you sure you want to completely remove this user?")) {
            onConfirm();
        }
    }}>
      <Trash2 className="h-4 w-4" />
    </Button>
  );
};
