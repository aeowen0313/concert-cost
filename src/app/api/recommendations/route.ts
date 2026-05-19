import { NextResponse } from "next/server";
import {
  buildArtistPreferences,
  getFrequentRegions,
} from "@/lib/artist-preferences";
import { fetchSimilarArtists } from "@/lib/lastfm";
import {
  buildSeenArtistSet,
  normalizeArtist,
  rankRecommendations,
  scoreNewArtistShow,
} from "@/lib/recommendations";
import { createClient } from "@/lib/supabase/server";
import {
  fetchUpcomingForArtist,
  fetchUpcomingInState,
} from "@/lib/ticketmaster";
import type { Concert } from "@/types/concert";

function toFullConcert(
  r: Pick<Concert, "artist" | "state" | "city" | "fun_rating" | "concert_date">
): Concert {
  return {
    ...r,
    id: "",
    user_id: "",
    concert_name: "",
    venue: "",
    distance_from_home: 0,
    hours_at_event: 1,
    ticket_cost: 0,
    ticket_fees: 0,
    parking_cost: 0,
    food_drink_cost: 0,
    merchandise_cost: 0,
    lodging_cost: 0,
    travel_cost: 0,
    other_cost: 0,
    notes: null,
    created_at: "",
  };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: concerts, error } = await supabase
    .from("concerts")
    .select("artist, state, city, fun_rating, concert_date")
    .order("concert_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (concerts ?? []) as Pick<
    Concert,
    "artist" | "state" | "city" | "fun_rating" | "concert_date"
  >[];

  if (rows.length === 0) {
    return NextResponse.json({
      recommendations: [],
      preferences: [],
      needsConcerts: true,
      apiConfigured: Boolean(process.env.TICKETMASTER_API_KEY),
    });
  }

  const fullRows = rows.map(toFullConcert);
  const preferences = buildArtistPreferences(fullRows);
  const { states: preferredStates } = getFrequentRegions(fullRows);
  const seenArtistNorms = buildSeenArtistSet(preferences);

  const tmKey = process.env.TICKETMASTER_API_KEY;
  const lastfmKey = process.env.LASTFM_API_KEY;

  if (!tmKey) {
    return NextResponse.json({
      recommendations: [],
      preferences: preferences.slice(0, 6),
      needsApiKey: true,
      apiConfigured: false,
    });
  }

  const artistsToSearch = new Set<string>();
  const similarArtistMap = new Map<
    string,
    { basedOn: string; avgFun: number }
  >();

  if (lastfmKey) {
    const tasteAnchors = preferences
      .filter((p) => p.avgFun >= 5)
      .slice(0, 5);

    for (const pref of tasteAnchors) {
      const similar = await fetchSimilarArtists(pref.artist, lastfmKey, 8);
      for (const name of similar) {
        const norm = normalizeArtist(name);
        if (seenArtistNorms.has(norm)) continue;
        artistsToSearch.add(name);
        if (!similarArtistMap.has(norm)) {
          similarArtistMap.set(norm, {
            basedOn: pref.artist,
            avgFun: pref.avgFun,
          });
        }
      }
    }
  }

  const seenEventIds = new Set<string>();
  const scored: ReturnType<typeof scoreNewArtistShow>[] = [];

  function collect(shows: Awaited<ReturnType<typeof fetchUpcomingForArtist>>) {
    for (const show of shows) {
      if (seenEventIds.has(show.id)) continue;
      seenEventIds.add(show.id);
      const rec = scoreNewArtistShow(
        show,
        seenArtistNorms,
        similarArtistMap,
        preferredStates
      );
      if (rec) scored.push(rec);
    }
  }

  for (const artist of artistsToSearch) {
    collect(await fetchUpcomingForArtist(artist, tmKey));
  }

  for (const state of preferredStates.slice(0, 3)) {
    collect(await fetchUpcomingInState(state, tmKey));
  }

  const recommendations = rankRecommendations(
    scored.filter((s): s is NonNullable<typeof s> => s !== null)
  ).slice(0, 24);

  const topPrefs = preferences.slice(0, 6);

  return NextResponse.json({
    recommendations,
    preferences: topPrefs,
    needsConcerts: false,
    needsApiKey: false,
    apiConfigured: true,
    similarArtistsEnabled: Boolean(lastfmKey),
    newArtistsOnly: true,
    needsLastFm:
      !lastfmKey && recommendations.length === 0 && artistsToSearch.size === 0,
  });
}
