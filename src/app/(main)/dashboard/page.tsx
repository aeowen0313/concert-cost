import { DashboardView } from "@/components/DashboardView";
import { fetchUserConcerts } from "@/lib/fetch-concerts";

export default async function DashboardPage() {
  const concerts = await fetchUserConcerts();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-sm opacity-70 mb-6">
        Your concert spending and fun at a glance.
      </p>
      <DashboardView concerts={concerts} />
    </div>
  );
}
