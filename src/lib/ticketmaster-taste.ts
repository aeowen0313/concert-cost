import type { ArtistPreference } from "@/lib/artist-preferences";
import {
  isArtistAlreadySeen,
  mergeArtistRecommendation,
  normalizeArtist,
  rankRecommendedArtists,
  scoreRecommendedArtist,
  type RecommendedArtist,
} from "@/lib/recommendations";

type TmClassification = {
  genre?: { id?: string; name?: string };
  subGenre?: { id?: string; name?: string };
};

type TmEventRaw = {
  _embedded?: {
    attractions?: Array<{ name?: string }>;
    venues?: unknown[];
  };
  classifications?: TmClassification[];
};

type GenreTaste = {
  genreId: string;
  genreName: string;
  subGenreId?: string;
  subGenreName?: string;
  basedOn: ArtistPreference;
};

async function tmGet<T>(path: string, params: Record<string, string>, apiKey: string): Promise<T | null> {
  const search = new URLSearchParams({ apikey: apiKey, ...params });
  const res = await fetch(`https://app.ticketmaster.com/discovery/v2/${path}?${search}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

/** Look up Ticketmaster genre tags for an artist the user already saw */
export async function fetchGenreTasteForArtist(
  pref: ArtistPreference,
  apiKey: string
): Promise<GenreTaste | null> {
  const data = await tmGet<{
    _embedded?: {
      attractions?: Array<{
        classifications?: TmClassification[];
      }>;
    };
  }>("attractions.json", { keyword: pref.artist, classificationName: "music", size: "1" }, apiKey);

  const classification = data?._embedded?.attractions?.[0]?.classifications?.[0];
  const genreId = classification?.genre?.id;
  const genreName = classification?.genre?.name;
  if (!genreId || !genreName) {
    const eventData = await tmGet<{ _embedded?: { events?: TmEventRaw[] } }>(
      "events.json",
      { keyword: pref.artist, classificationName: "music", size: "1" },
      apiKey
    );
    const fromEvent = eventData?._embedded?.events?.[0]?.classifications?.[0];
    if (!fromEvent?.genre?.id || !fromEvent.genre.name) return null;
    return {
      genreId: fromEvent.genre.id,
      genreName: fromEvent.genre.name,
      subGenreId: fromEvent.subGenre?.id,
      subGenreName: fromEvent.subGenre?.name,
      basedOn: pref,
    };
  }

  return {
    genreId,
    genreName,
    subGenreId: classification.subGenre?.id,
    subGenreName: classification.subGenre?.name,
    basedOn: pref,
  };
}

async function fetchEventsForGenre(taste: GenreTaste, apiKey: string): Promise<TmEventRaw[]> {
  const params: Record<string, string> = {
    countryCode: "US",
    classificationName: "music",
    genreId: taste.genreId,
    size: "30",
    sort: "relevance,desc",
  };
  if (taste.subGenreId) params.subGenreId = taste.subGenreId;

  const data = await tmGet<{ _embedded?: { events?: TmEventRaw[] } }>(
    "events.json",
    params,
    apiKey
  );
  return data?._embedded?.events ?? [];
}

function artistsOnEvents(events: TmEventRaw[]): string[] {
  const names: string[] = [];
  for (const ev of events) {
    for (const a of ev._embedded?.attractions ?? []) {
      if (a.name?.trim()) names.push(a.name.trim());
    }
  }
  return names;
}

/** Discover new artists via Ticketmaster genres from concerts you've logged */
export async function discoverArtistsViaTicketmaster(
  preferences: ArtistPreference[],
  seenArtistNorms: Set<string>,
  apiKey: string
): Promise<RecommendedArtist[]> {
  const byNorm = new Map<string, RecommendedArtist>();
  const genreKeys = new Set<string>();
  const tastes: GenreTaste[] = [];

  for (const pref of preferences.slice(0, 6)) {
    const taste = await fetchGenreTasteForArtist(pref, apiKey);
    if (!taste) continue;
    const key = `${taste.genreId}:${taste.subGenreId ?? ""}`;
    if (genreKeys.has(key)) continue;
    genreKeys.add(key);
    tastes.push(taste);
  }

  for (const taste of tastes) {
    const events = await fetchEventsForGenre(taste, apiKey);
    const candidates = artistsOnEvents(events);

    for (const name of candidates) {
      if (isArtistAlreadySeen(name, seenArtistNorms)) continue;

      const norm = normalizeArtist(name);
      const rec = scoreRecommendedArtist(name, {
        basedOn: taste.basedOn.artist,
        avgFun: taste.basedOn.avgFun,
        showCount: taste.basedOn.showCount,
        genreName: taste.subGenreName ?? taste.genreName,
      });

      const existing = byNorm.get(norm);
      byNorm.set(norm, existing ? mergeArtistRecommendation(existing, rec) : rec);
    }
  }

  return rankRecommendedArtists([...byNorm.values()]).slice(0, 20);
}
