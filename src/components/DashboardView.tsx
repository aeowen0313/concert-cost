"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Concert } from "@/types/concert";
import {
  COST_FIELDS,
  formatCurrency,
  formatDate,
  getBestNightHighlights,
  getCostPerHour,
  getFunPointsPer100,
  getTotalCost,
} from "@/lib/concert-calculations";
import { EmptyState } from "@/components/EmptyState";

const CHART_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
];

type DashboardViewProps = {
  concerts: Concert[];
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat bg-base-100 shadow rounded-box">
      <div className="stat-title text-xs">{label}</div>
      <div className="stat-value text-lg sm:text-xl">{value}</div>
    </div>
  );
}

export function DashboardView({ concerts }: DashboardViewProps) {
  if (concerts.length === 0) {
    return (
      <EmptyState message="No concerts logged yet. Add your first concert to start seeing your dashboard." />
    );
  }

  const totals = concerts.map((c) => ({
    concert: c,
    total: getTotalCost(c),
    costPerHour: getCostPerHour(c),
    funPer100: getFunPointsPer100(c),
  }));

  const totalSpent = totals.reduce((s, t) => s + t.total, 0);
  const avgCost = totalSpent / concerts.length;
  const avgFun =
    concerts.reduce((s, c) => s + c.fun_rating, 0) / concerts.length;
  const avgCostPerHour =
    totals.reduce((s, t) => s + t.costPerHour, 0) / concerts.length;

  const bestValue = totals.reduce((best, t) =>
    t.funPer100 > best.funPer100 ? t : best
  );
  const mostExpensive = totals.reduce((best, t) =>
    t.total > best.total ? t : best
  );
  const highestFun = totals.reduce((best, t) =>
    t.concert.fun_rating > best.concert.fun_rating ? t : best
  );

  const categoryTotals = COST_FIELDS.map(({ key, label }) => ({
    name: label,
    value: concerts.reduce((s, c) => s + Number(c[key] ?? 0), 0),
  })).filter((c) => c.value > 0);

  const bestNight = getBestNightHighlights(concerts);

  const byConcert = totals.map((t) => ({
    name:
      t.concert.concert_name.length > 18
        ? `${t.concert.concert_name.slice(0, 16)}…`
        : t.concert.concert_name,
    fullName: t.concert.concert_name,
    total: Math.round(t.total * 100) / 100,
    fun: t.concert.fun_rating,
    funPer100: Math.round(t.funPer100 * 100) / 100,
  }));

  return (
    <div className="space-y-8">
      {bestNight ? <BestNightBanner highlights={bestNight} /> : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total concerts" value={String(concerts.length)} />
        <StatCard label="Total spent" value={formatCurrency(totalSpent)} />
        <StatCard label="Avg cost / concert" value={formatCurrency(avgCost)} />
        <StatCard label="Avg fun rating" value={avgFun.toFixed(1)} />
        <StatCard label="Avg cost / hour" value={formatCurrency(avgCostPerHour)} />
        <StatCard
          label="Best value"
          value={bestValue.concert.concert_name}
        />
        <StatCard
          label="Most expensive"
          value={`${mostExpensive.concert.concert_name} (${formatCurrency(mostExpensive.total)})`}
        />
        <StatCard
          label="Highest fun"
          value={`${highestFun.concert.concert_name} (${highestFun.concert.fun_rating}/10)`}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard title="Spending by cost category">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryTotals}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {categoryTotals.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Total cost by concert">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byConcert} margin={{ bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" angle={-25} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(v) => formatCurrency(Number(v ?? 0))}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.fullName ?? ""
                }
              />
              <Bar dataKey="total" fill="#6366f1" name="Total cost" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fun rating by concert">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byConcert} margin={{ bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" angle={-25} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 10]} />
              <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ""} />
              <Bar dataKey="fun" fill="#ec4899" name="Fun rating" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fun Points per $100 by concert">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byConcert} margin={{ bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" angle={-25} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ""} />
              <Bar dataKey="funPer100" fill="#10b981" name="Fun Points per $100" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function BestNightBanner({
  highlights,
}: {
  highlights: NonNullable<ReturnType<typeof getBestNightHighlights>>;
}) {
  const { bestNightEver, highestFun, bestValue, reason } = highlights;
  const total = getTotalCost(bestNightEver);
  const funPer100 = getFunPointsPer100(bestNightEver);
  const sameShow = highestFun.concert.id === bestValue.concert.id;

  return (
    <div className="card bg-gradient-to-br from-primary/25 via-secondary/15 to-accent/20 shadow-lg border border-primary/30">
      <div className="card-body gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge badge-primary badge-lg gap-1">Best night ever</span>
          {reason === "both" ? (
            <span className="badge badge-secondary badge-sm">Top fun &amp; best value</span>
          ) : (
            <span className="badge badge-secondary badge-sm">Highest fun rating</span>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold">{bestNightEver.concert_name}</h2>
          <p className="text-sm opacity-80">
            {bestNightEver.artist} · {bestNightEver.venue} · {formatDate(bestNightEver.concert_date)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <span className="badge badge-outline">
            Fun {highestFun.funRating}/10
          </span>
          <span className="badge badge-outline">
            {formatCurrency(total)} total
          </span>
          <span className="badge badge-outline">
            {funPer100.toFixed(2)} Fun Points per $100
          </span>
        </div>

        {!sameShow ? (
          <p className="text-sm opacity-80 border-t border-primary/20 pt-2">
            <span className="font-medium">Best bang for your buck:</span>{" "}
            {bestValue.concert.concert_name} ({bestValue.funPer100.toFixed(2)} Fun Points per
            $100)
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h3 className="card-title text-base mb-2">{title}</h3>
        {children}
      </div>
    </div>
  );
}

