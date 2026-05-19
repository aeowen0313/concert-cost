import type { Concert } from "@/types/concert";

export type ArtistPreference = {
  artist: string;
  showCount: number;
  avgFun: number;
  states: string[];
  cities: string[];
  /** Higher = more likely you'd attend again */
  affinityScore: number;
};

export function buildArtistPreferences(concerts: Concert[]): ArtistPreference[] {
  const byArtist = new Map<
    string,
    { funSum: number; count: number; states: Set<string>; cities: Set<string> }
  >();

  for (const c of concerts) {
    const key = c.artist.trim();
    if (!key) continue;
    const entry = byArtist.get(key) ?? {
      funSum: 0,
      count: 0,
      states: new Set<string>(),
      cities: new Set<string>(),
    };
    entry.funSum += c.fun_rating;
    entry.count += 1;
    if (c.state) entry.states.add(c.state.trim().toUpperCase());
    if (c.city) entry.cities.add(c.city.trim());
    byArtist.set(key, entry);
  }

  return Array.from(byArtist.entries())
    .map(([artist, data]) => {
      const avgFun = data.funSum / data.count;
      const affinityScore = data.count * 12 + avgFun * 8;
      return {
        artist,
        showCount: data.count,
        avgFun: Math.round(avgFun * 10) / 10,
        states: [...data.states],
        cities: [...data.cities],
        affinityScore,
      };
    })
    .sort((a, b) => b.affinityScore - a.affinityScore);
}

export function getFrequentRegions(concerts: Concert[]): {
  states: string[];
  cities: string[];
} {
  const stateCount = new Map<string, number>();
  const cityCount = new Map<string, number>();

  for (const c of concerts) {
    const st = c.state?.trim().toUpperCase();
    if (st) stateCount.set(st, (stateCount.get(st) ?? 0) + 1);
    const city = c.city?.trim();
    if (city) cityCount.set(city, (cityCount.get(city) ?? 0) + 1);
  }

  const top = (map: Map<string, number>, n: number) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k]) => k);

  return {
    states: top(stateCount, 5),
    cities: top(cityCount, 5),
  };
}
