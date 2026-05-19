import { RecommendationsView } from "@/components/RecommendationsView";

export default function RecommendationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Show Predictions</h1>
      <p className="text-sm opacity-70 mb-6">
        Discover upcoming shows for <strong>new artists</strong> you haven&apos;t seen
        yet — matched to your taste from concerts you&apos;ve logged.
      </p>
      <RecommendationsView />
    </div>
  );
}
