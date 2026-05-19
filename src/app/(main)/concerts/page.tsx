import { ConcertList } from "@/components/ConcertList";
import { fetchUserConcerts } from "@/lib/fetch-concerts";

export default async function ConcertsPage() {
  const concerts = await fetchUserConcerts();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">My Concerts</h1>
      <p className="text-sm opacity-70 mb-6">
        Every show you have logged, with costs and fun ratings.
      </p>
      <ConcertList concerts={concerts} />
    </div>
  );
}
