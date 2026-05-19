import { normalizeArtist } from "@/lib/recommendations";

export type UpcomingShow = {
  id: string;
  eventName: string;
  artist: string;
  venue: string;
  city: string;
  state: string;
  date: string;
  time?: string;
  url: string;
};

type TmEvent = {
  id: string;
  name: string;
  url: string;
  dates?: { start?: { localDate?: string; localTime?: string } };
  _embedded?: {
    venues?: Array<{
      name?: string;
      city?: { name?: string };
      state?: { stateCode?: string };
    }>;
    attractions?: Array<{ name?: string; id?: string }>;
  };
};

function parseEvents(
  events: TmEvent[],
  searchArtist: string
): UpcomingShow[] {
  const today = new Date().toISOString().slice(0, 10);
  const searchNorm = normalizeArtist(searchArtist);

  return events
    .map((ev) => {
      const venue = ev._embedded?.venues?.[0];
      const attractions = ev._embedded?.attractions ?? [];
      const match =
        attractions.find((a) => normalizeArtist(a.name ?? "") === searchNorm) ??
        attractions[0];
      const date = ev.dates?.start?.localDate ?? "";
      return {
        id: ev.id,
        eventName: ev.name,
        artist: match?.name ?? searchArtist,
        venue: venue?.name ?? "Venue TBA",
        city: venue?.city?.name ?? "",
        state: venue?.state?.stateCode ?? "",
        date,
        time: ev.dates?.start?.localTime,
        url: ev.url,
      };
    })
    .filter((ev) => ev.date >= today && ev.artist.trim().length > 0);
}

async function fetchEvents(
  params: Record<string, string>,
  apiKey: string,
  searchArtist: string
): Promise<UpcomingShow[]> {
  const search = new URLSearchParams({
    apikey: apiKey,
    countryCode: "US",
    sort: "date,asc",
    classificationName: "music",
    ...params,
  });

  const res = await fetch(
    `https://app.ticketmaster.com/discovery/v2/events.json?${search}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) return [];

  const data = (await res.json()) as { _embedded?: { events?: TmEvent[] } };
  return parseEvents(data._embedded?.events ?? [], searchArtist);
}

async function resolveAttractionId(
  artist: string,
  apiKey: string
): Promise<string | undefined> {
  const search = new URLSearchParams({
    apikey: apiKey,
    keyword: artist,
    classificationName: "music",
    size: "5",
  });

  const res = await fetch(
    `https://app.ticketmaster.com/discovery/v2/attractions.json?${search}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) return undefined;

  const data = (await res.json()) as {
    _embedded?: { attractions?: Array<{ id?: string; name?: string }> };
  };

  const target = normalizeArtist(artist);
  const attractions = data._embedded?.attractions ?? [];
  const exact = attractions.find((a) => normalizeArtist(a.name ?? "") === target);
  return exact?.id ?? attractions[0]?.id;
}

export async function fetchUpcomingForArtist(
  artist: string,
  apiKey: string,
  attractionId?: string
): Promise<UpcomingShow[]> {
  const id = attractionId ?? (await resolveAttractionId(artist, apiKey));

  if (id) {
    const byAttraction = await fetchEvents(
      { attractionId: id, size: "20" },
      apiKey,
      artist
    );
    if (byAttraction.length > 0) return byAttraction;
  }

  return fetchEvents({ keyword: artist, size: "20" }, apiKey, artist);
}
