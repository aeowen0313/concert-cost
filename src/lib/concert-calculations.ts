import type { Concert } from "@/types/concert";

export const COST_FIELDS = [
  { key: "ticket_cost" as const, label: "Tickets" },
  { key: "ticket_fees" as const, label: "Ticket fees" },
  { key: "parking_cost" as const, label: "Parking" },
  { key: "food_drink_cost" as const, label: "Food & drink" },
  { key: "merchandise_cost" as const, label: "Merchandise" },
  { key: "lodging_cost" as const, label: "Lodging" },
  { key: "travel_cost" as const, label: "Travel / gas" },
  { key: "other_cost" as const, label: "Other" },
];

export function getTotalCost(concert: Pick<Concert, (typeof COST_FIELDS)[number]["key"]>): number {
  return COST_FIELDS.reduce((sum, { key }) => sum + Number(concert[key] ?? 0), 0);
}

export function getCostPerHour(
  concert: Pick<Concert, (typeof COST_FIELDS)[number]["key"] | "hours_at_event">
): number {
  const hours = Number(concert.hours_at_event);
  if (!hours || hours <= 0) return 0;
  return getTotalCost(concert) / hours;
}

export function getFunPointsPer100(
  concert: Pick<Concert, (typeof COST_FIELDS)[number]["key"] | "fun_rating">
): number {
  const total = getTotalCost(concert);
  if (total <= 0) return 0;
  return (Number(concert.fun_rating) / total) * 100;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export type BestNightHighlights = {
  highestFun: { concert: Concert; funRating: number };
  bestValue: { concert: Concert; funPer100: number };
  /** Same concert wins both, or highest fun when they differ */
  bestNightEver: Concert;
  reason: "both" | "fun" | "value";
};

export function getBestNightHighlights(concerts: Concert[]): BestNightHighlights | null {
  if (concerts.length === 0) return null;

  let highestFun = concerts[0];
  let bestValue = concerts[0];
  let bestFunPer100 = getFunPointsPer100(concerts[0]);

  for (const c of concerts.slice(1)) {
    if (c.fun_rating > highestFun.fun_rating) highestFun = c;
    const fp100 = getFunPointsPer100(c);
    if (fp100 > bestFunPer100) {
      bestValue = c;
      bestFunPer100 = fp100;
    }
  }

  const funPer100Highest = getFunPointsPer100(highestFun);
  const sameConcert = highestFun.id === bestValue.id;

  return {
    highestFun: { concert: highestFun, funRating: highestFun.fun_rating },
    bestValue: { concert: bestValue, funPer100: bestFunPer100 },
    bestNightEver: sameConcert ? highestFun : highestFun,
    reason: sameConcert ? "both" : "fun",
  };
}

export function getTopCostCategories(
  concert: Pick<Concert, (typeof COST_FIELDS)[number]["key"]>,
  limit = 3
): { label: string; amount: number }[] {
  return COST_FIELDS.map(({ key, label }) => ({
    label,
    amount: Number(concert[key] ?? 0),
  }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}
