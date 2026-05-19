import type { ArtistPreference } from "@/lib/artist-preferences";

export type SimilarArtistMeta = {
  basedOn: string;
  avgFun: number;
  showCount: number;
};

export type RecommendedArtist = {
  name: string;
  matchScore: number;
  matchReasons: string[];
  basedOn: string;
};

export function normalizeArtist(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function buildSeenArtistSet(preferences: ArtistPreference[]): Set<string> {
  return new Set(preferences.map((p) => normalizeArtist(p.artist)));
}

export function isArtistAlreadySeen(
  artistName: string,
  seenArtistNorms: Set<string>
): boolean {
  const showNorm = normalizeArtist(artistName);
  if (!showNorm) return true;

  if (seenArtistNorms.has(showNorm)) return true;

  for (const seen of seenArtistNorms) {
    if (showNorm.includes(seen) || seen.includes(showNorm)) return true;
  }
  return false;
}

/** Taste-only score — how likely you'd enjoy this new artist */
export function scoreRecommendedArtist(
  artistName: string,
  meta: SimilarArtistMeta
): RecommendedArtist {
  const score = Math.round(
    40 + meta.avgFun * 10 + meta.showCount * 8
  );
  return {
    name: artistName,
    matchScore: score,
    basedOn: meta.basedOn,
    matchReasons: [
      `Similar sound to ${meta.basedOn} — you rated them ${meta.avgFun}/10 fun`,
      meta.showCount > 1
        ? `You've been to ${meta.showCount} ${meta.basedOn} shows`
        : `You logged a ${meta.basedOn} concert`,
      "You haven't seen this artist yet",
    ],
  };
}

export function mergeArtistRecommendation(
  existing: RecommendedArtist,
  incoming: RecommendedArtist
): RecommendedArtist {
  if (incoming.matchScore <= existing.matchScore) return existing;
  return incoming;
}

export function rankRecommendedArtists(
  artists: RecommendedArtist[]
): RecommendedArtist[] {
  return [...artists].sort((a, b) => b.matchScore - a.matchScore);
}
