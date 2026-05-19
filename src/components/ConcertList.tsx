import type { Concert } from "@/types/concert";
import {
  formatCurrency,
  formatDate,
  getCostPerHour,
  getFunPointsPer100,
  getTopCostCategories,
  getTotalCost,
} from "@/lib/concert-calculations";
import { EmptyState } from "@/components/EmptyState";

type ConcertListProps = {
  concerts: Concert[];
};

export function ConcertList({ concerts }: ConcertListProps) {
  if (concerts.length === 0) {
    return (
      <EmptyState message="No concerts logged yet. Add your first concert to start seeing your dashboard." />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {concerts.map((concert) => {
        const total = getTotalCost(concert);
        const costPerHour = getCostPerHour(concert);
        const funPer100 = getFunPointsPer100(concert);
        const topCosts = getTopCostCategories(concert);

        return (
          <article key={concert.id} className="card bg-base-100 shadow-md">
            <div className="card-body gap-3">
              <div className="flex flex-wrap justify-between gap-2 items-start">
                <div>
                  <h2 className="card-title text-lg">{concert.concert_name}</h2>
                  <p className="text-sm opacity-80">{concert.artist}</p>
                </div>
                <div className="badge badge-primary badge-lg">
                  Fun: {concert.fun_rating}/10
                </div>
              </div>

              <p className="text-sm">
                {concert.venue} · {concert.city}, {concert.state}
              </p>
              <p className="text-sm opacity-70">{formatDate(concert.concert_date)}</p>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-base-200 rounded-lg p-2">
                  <p className="text-xs opacity-70">Total cost</p>
                  <p className="font-semibold">{formatCurrency(total)}</p>
                </div>
                <div className="bg-base-200 rounded-lg p-2">
                  <p className="text-xs opacity-70">Cost per hour</p>
                  <p className="font-semibold">{formatCurrency(costPerHour)}</p>
                </div>
                <div className="bg-base-200 rounded-lg p-2 col-span-2">
                  <p className="text-xs opacity-70">Fun Points per $100</p>
                  <p className="font-semibold">{funPer100.toFixed(2)}</p>
                </div>
              </div>

              {topCosts.length > 0 ? (
                <div>
                  <p className="text-xs font-medium mb-1">Main cost categories</p>
                  <div className="flex flex-wrap gap-1">
                    {topCosts.map((c) => (
                      <span key={c.label} className="badge badge-outline badge-sm">
                        {c.label}: {formatCurrency(c.amount)}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {concert.notes ? (
                <p className="text-sm border-t border-base-300 pt-2 opacity-80">
                  <span className="font-medium">Notes:</span> {concert.notes}
                </p>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
