import { NextResponse } from "next/server";
import { buildArtistPreferences } from "@/lib/artist-preferences";
import { buildSeenArtistSet } from "@/lib/recommendations";
import { createClient } from "@/lib/supabase/server";
import { discoverArtistsViaTicketmaster } from "@/lib/ticketmaster-taste";
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
  const tmKey = process.env.TICKETMASTER_API_KEY;

  if (!tmKey) {
    return NextResponse.json({
      artists: [],
      preferences: preferences.slice(0, 6),
      needsApiKey: true,
    });
  }

  const artists = await discoverArtistsViaTicketmaster(
    preferences,
    seenArtistNorms,
    tmKey
  );

  return NextResponse.json({
    artists,
    preferences: preferences.slice(0, 6),
    needsConcerts: false,
    needsApiKey: false,
    showsApiConfigured: true,
  });
}
