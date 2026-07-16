/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { seedTestData, clearTestData } from "@/api/users";
import { Database, Trash2 } from "lucide-react";

export default function SeedDataButton() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleSeed = async () => {
    if (!session?.user?.token) return;
    setIsLoading(true);
    try {
      await seedTestData(session?.user?.token);
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

  const handleClear = async () => {
    if (!session?.user?.token) return;
    if (!confirm("Are you sure you want to clear all dummy test drive orders?")) return;
    setIsClearing(true);
    try {
      await clearTestData(session?.user?.token);
      toast.success("Test Drive data cleared successfully! Refreshing...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || error.message || "Failed to clear test data";
      toast.error(`Error: ${msg}`);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        onClick={handleSeed} 
        disabled={isLoading || isClearing}
        className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700"
      >
        <Database className="w-4 h-4 mr-2" />
        {isLoading ? "Generating..." : "Test Drive (Seed Data)"}
      </Button>
      
      <Button 
        variant="outline" 
        onClick={handleClear} 
        disabled={isLoading || isClearing}
        className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        {isClearing ? "Clearing..." : "Clear Dummy Orders"}
      </Button>
    </div>
  );
}
