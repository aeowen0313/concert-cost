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
