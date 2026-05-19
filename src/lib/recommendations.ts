import type { ArtistPreference } from "@/lib/artist-preferences";
import type { UpcomingShow } from "@/lib/ticketmaster";

export type SimilarArtistMeta = {
  basedOn: string;
  avgFun: number;
};

export type RecommendedShow = UpcomingShow & {
  matchScore: number;
  matchReasons: string[];
  source: "similar" | "discovery";
};

export function normalizeArtist(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function buildSeenArtistSet(preferences: ArtistPreference[]): Set<string> {
  return new Set(preferences.map((p) => normalizeArtist(p.artist)));
}

/** True if this show's artist is one the user already logged */
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

/** Score only shows for artists the user has NOT seen before */
export function scoreNewArtistShow(
  show: UpcomingShow,
  seenArtistNorms: Set<string>,
  similarArtistMap: Map<string, SimilarArtistMeta>,
  preferredStates: string[]
): RecommendedShow | null {
  if (isArtistAlreadySeen(show.artist, seenArtistNorms)) {
    return null;
  }

  const showArtistNorm = normalizeArtist(show.artist);
  const reasons: string[] = [];
  let score = 0;
  let source: RecommendedShow["source"] = "discovery";

  const similarInfo = similarArtistMap.get(showArtistNorm);
  if (similarInfo) {
    score += 45 + similarInfo.avgFun * 6;
    reasons.push(
      `You haven't seen them yet — similar to ${similarInfo.basedOn} (avg fun ${similarInfo.avgFun}/10)`
    );
    source = "similar";
  }

  if (show.state && preferredStates.includes(show.state.toUpperCase())) {
    score += 16;
    reasons.push(`Playing in ${show.state}, where you often go to concerts`);
  }

  if (score <= 0) {
    if (show.state && preferredStates.includes(show.state.toUpperCase())) {
      score = 14;
      reasons.push("New artist near places you usually see live music");
    } else {
      return null;
    }
  }

  return {
    ...show,
    matchScore: Math.round(score),
    matchReasons: [...new Set(reasons)],
    source,
  };
}

export function rankRecommendations(shows: RecommendedShow[]): RecommendedShow[] {
  return [...shows].sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return a.date.localeCompare(b.date);
  });
}
