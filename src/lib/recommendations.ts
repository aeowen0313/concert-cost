import type { ArtistPreference } from "@/lib/artist-preferences";
import type { UpcomingShow } from "@/lib/ticketmaster";

export type RecommendedShow = UpcomingShow & {
  matchScore: number;
  matchReasons: string[];
  source: "repeat" | "similar" | "region";
};

function normalizeArtist(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function scoreUpcomingShow(
  show: UpcomingShow,
  preferences: ArtistPreference[],
  preferredStates: string[],
  similarArtistSet: Set<string>
): RecommendedShow | null {
  const showArtistNorm = normalizeArtist(show.artist);
  const reasons: string[] = [];
  let score = 0;
  let source: RecommendedShow["source"] = "region";

  for (const pref of preferences) {
    const prefNorm = normalizeArtist(pref.artist);
    if (
      showArtistNorm === prefNorm ||
      showArtistNorm.includes(prefNorm) ||
      prefNorm.includes(showArtistNorm)
    ) {
      score += 50 + pref.showCount * 10 + pref.avgFun * 5;
      reasons.push(
        `You've seen ${pref.artist} ${pref.showCount} time${pref.showCount > 1 ? "s" : ""} (avg fun ${pref.avgFun}/10)`
      );
      source = "repeat";
      break;
    }
  }

  if (similarArtistSet.has(showArtistNorm)) {
    score += 35;
    reasons.push("Similar to artists you rated highly");
    source = "similar";
  }

  if (show.state && preferredStates.includes(show.state.toUpperCase())) {
    score += 18;
    reasons.push(`In ${show.state}, where you've been to shows before`);
    if (source === "region") source = "region";
  }

  if (score <= 0) return null;

  if (reasons.length === 0) {
    reasons.push("Matches your concert taste profile");
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
