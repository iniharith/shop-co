import DashboardOverview from "@/components/global/dashboard/dashboardOverview";

export default function Page() {
  return (
    <>
      <div className="flex px-4 py-2 items-center justify-between space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Hi, Welcome back 👋
        </h2>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <DashboardOverview />
      </div>
    </> 
  );
}
