import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchUpcomingForArtist } from "@/lib/ticketmaster";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const artist = new URL(request.url).searchParams.get("artist")?.trim();
  if (!artist) {
    return NextResponse.json({ error: "Artist name required" }, { status: 400 });
  }

  const tmKey = process.env.TICKETMASTER_API_KEY;
  if (!tmKey) {
    return NextResponse.json(
      { error: "Ticketmaster API not configured", needsApiKey: true },
      { status: 503 }
    );
  }

  const shows = await fetchUpcomingForArtist(artist, tmKey);

  return NextResponse.json({
    artist,
    shows,
  });
}
