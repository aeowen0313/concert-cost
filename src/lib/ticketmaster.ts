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
    attractions?: Array<{ name?: string }>;
  };
};

function parseEvents(events: TmEvent[], fallbackArtist = ""): UpcomingShow[] {
  const today = new Date().toISOString().slice(0, 10);

  return events
    .map((ev) => {
      const venue = ev._embedded?.venues?.[0];
      const attraction = ev._embedded?.attractions?.[0];
      const date = ev.dates?.start?.localDate ?? "";
      return {
        id: ev.id,
        eventName: ev.name,
        artist: attraction?.name ?? fallbackArtist,
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
  fallbackArtist = ""
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
  return parseEvents(data._embedded?.events ?? [], fallbackArtist);
}

export async function fetchUpcomingForArtist(
  artist: string,
  apiKey: string
): Promise<UpcomingShow[]> {
  return fetchEvents({ keyword: artist, size: "8" }, apiKey, artist);
}

/** Music events in a US state — used to discover artists you have not logged yet */
export async function fetchUpcomingInState(
  stateCode: string,
  apiKey: string
): Promise<UpcomingShow[]> {
  return fetchEvents({ stateCode, size: "15" }, apiKey);
}
