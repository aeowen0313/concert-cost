import { NextResponse } from "next/server";
import { buildArtistPreferences } from "@/lib/artist-preferences";
import { fetchSimilarArtists } from "@/lib/lastfm";
import {
  buildSeenArtistSet,
  isArtistAlreadySeen,
  mergeArtistRecommendation,
  normalizeArtist,
  rankRecommendedArtists,
  scoreRecommendedArtist,
} from "@/lib/recommendations";
import { createClient } from "@/lib/supabase/server";
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
      artists: [],
      preferences: [],
      needsConcerts: true,
    });
  }

  const preferences = buildArtistPreferences(rows.map(toFullConcert));
  const seenArtistNorms = buildSeenArtistSet(preferences);
  const lastfmKey = process.env.LASTFM_API_KEY;

  if (!lastfmKey) {
    return NextResponse.json({
      artists: [],
      preferences: preferences.slice(0, 6),
      needsLastFm: true,
    });
  }

  const byNorm = new Map<string, ReturnType<typeof scoreRecommendedArtist>>();

  const tasteAnchors = preferences.slice(0, 8);

  for (const pref of tasteAnchors) {
    const similar = await fetchSimilarArtists(pref.artist, lastfmKey, 10);
    for (const name of similar) {
      if (isArtistAlreadySeen(name, seenArtistNorms)) continue;

      const norm = normalizeArtist(name);
      const rec = scoreRecommendedArtist(name, {
        basedOn: pref.artist,
        avgFun: pref.avgFun,
        showCount: pref.showCount,
      });

      const existing = byNorm.get(norm);
      byNorm.set(
        norm,
        existing ? mergeArtistRecommendation(existing, rec) : rec
      );
    }
  }

  const artists = rankRecommendedArtists([...byNorm.values()]).slice(0, 20);
  const topPrefs = preferences.slice(0, 6);

  return NextResponse.json({
    artists,
    preferences: topPrefs,
    needsConcerts: false,
    needsLastFm: false,
    showsApiConfigured: Boolean(process.env.TICKETMASTER_API_KEY),
  });
}
