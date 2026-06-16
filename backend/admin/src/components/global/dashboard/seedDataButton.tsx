"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { seedTestData } from "@/api/users";
import { DatabaseBackup } from "lucide-react";

export default function SeedDataButton() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleSeed = async () => {
    if (!session?.user?.token) return;
    setIsLoading(true);
    try {
      await seedTestData(session.user.token);
      toast.success("Test Drive data injected successfully! Refreshing...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || error.message || "Failed to inject test data";
      toast.error(`Error: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleSeed} 
      disabled={isLoading}
      className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700"
    >
      <DatabaseBackup className="w-4 h-4 mr-2" />
      {isLoading ? "Generating..." : "Test Drive (Seed Data)"}
    </Button>
  );
}
