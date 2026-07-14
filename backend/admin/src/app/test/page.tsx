"use client";
import { SessionProvider } from "next-auth/react";
import ProductionManager from "@/components/global/production/productionManager";

export default function TestPage() {
  return (
    <SessionProvider session={{ expires: "1", user: { name: "test" }, accessToken: "mock-token" } as any}>
      <ProductionManager />
    </SessionProvider>
  );
}
