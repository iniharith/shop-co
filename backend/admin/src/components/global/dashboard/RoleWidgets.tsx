"use client";
import { useSession } from "next-auth/react";
import { getWidgetsForRole } from "@/constants/dashboardWidgets";
import dynamic from "next/dynamic";

const DashboardOverview = dynamic(() => import("./dashboardOverview"), { loading: () => <div className="h-64 bg-muted/20 animate-pulse rounded-2xl" /> });
const DesignMetrics = dynamic(() => import("./widgets/DesignMetrics"), { loading: () => <div className="h-32 bg-muted/20 animate-pulse rounded-2xl" /> });
const ProductionMetrics = dynamic(() => import("./widgets/ProductionMetrics"), { loading: () => <div className="h-32 bg-muted/20 animate-pulse rounded-2xl" /> });
const PackagingMetrics = dynamic(() => import("./widgets/PackagingMetrics"), { loading: () => <div className="h-32 bg-muted/20 animate-pulse rounded-2xl" /> });
const StaffActivity = dynamic(() => import("./widgets/StaffActivity"), { loading: () => <div className="h-64 bg-muted/20 animate-pulse rounded-2xl" /> });

const WIDGET_COMPONENTS = {
  overview: DashboardOverview,
  designMetrics: DesignMetrics,
  productionMetrics: ProductionMetrics,
  packagingMetrics: PackagingMetrics,
  staffActivity: StaffActivity,
};

export function RoleWidgets() {
  const { data: session } = useSession();
  const role = (session?.user?.role as string) || "admin";
  const widgetIds = getWidgetsForRole(role);

  return (
    <div className="space-y-6">
      {widgetIds.map((id) => {
        const Component = WIDGET_COMPONENTS[id];
        if (!Component) return null;
        return <Component key={id} />;
      })}
    </div>
  );
}
