import { RecommendationsView } from "@/components/RecommendationsView";

export default function RecommendationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Artist Recommendations</h1>
      <p className="text-sm opacity-70 mb-6">
        New artists you might like based only on concerts you&apos;ve already been
        to — tap an artist to see where they&apos;re playing.
      </p>
      <RecommendationsView />
    </div>
  );
}
