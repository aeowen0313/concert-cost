import { RecommendationsView } from "@/components/RecommendationsView";

export default function RecommendationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Show Predictions</h1>
      <p className="text-sm opacity-70 mb-6">
        Upcoming concerts you might enjoy — based on artists you&apos;ve already seen,
        how much fun you had, and where you usually go.
      </p>
      <RecommendationsView />
    </div>
  );
}
