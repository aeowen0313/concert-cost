import { NextResponse } from "next/server";
import {
  buildArtistPreferences,
  getFrequentRegions,
} from "@/lib/artist-preferences";
import { fetchSimilarArtists } from "@/lib/lastfm";
import { rankRecommendations, scoreUpcomingShow } from "@/lib/recommendations";
import { createClient } from "@/lib/supabase/server";
import { fetchUpcomingForArtist } from "@/lib/ticketmaster";
import type { Concert } from "@/types/concert";

function normalizeArtist(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
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

  const preferences = buildArtistPreferences(
    rows.map((r) => ({
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
    }))
  );

  const { states: preferredStates } = getFrequentRegions(
    rows.map((r) => ({
      ...r,
      id: "",
      user_id: "",
      concert_name: "",
      artist: r.artist,
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
    }))
  );

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
  const topPrefs = preferences.slice(0, 6);
  for (const p of topPrefs) artistsToSearch.add(p.artist);

  const similarArtistSet = new Set<string>();
  if (lastfmKey) {
    const highRated = preferences.filter((p) => p.avgFun >= 7).slice(0, 2);
    for (const p of highRated) {
      const similar = await fetchSimilarArtists(p.artist, lastfmKey, 4);
      for (const name of similar) {
        artistsToSearch.add(name);
        similarArtistSet.add(normalizeArtist(name));
      }
    }
  }

  const seenEventIds = new Set<string>();
  const scored: ReturnType<typeof scoreUpcomingShow>[] = [];

  for (const artist of artistsToSearch) {
    const upcoming = await fetchUpcomingForArtist(artist, tmKey);
    for (const show of upcoming) {
      if (seenEventIds.has(show.id)) continue;
      seenEventIds.add(show.id);
      const rec = scoreUpcomingShow(
        show,
        preferences,
        preferredStates,
        similarArtistSet
      );
      if (rec) scored.push(rec);
    }
  }

  const recommendations = rankRecommendations(
    scored.filter((s): s is NonNullable<typeof s> => s !== null)
  ).slice(0, 24);

  return NextResponse.json({
    recommendations,
    preferences: topPrefs,
    needsConcerts: false,
    needsApiKey: false,
    apiConfigured: true,
    similarArtistsEnabled: Boolean(lastfmKey),
  });
}
