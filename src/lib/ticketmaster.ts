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

export async function fetchUpcomingForArtist(
  artist: string,
  apiKey: string
): Promise<UpcomingShow[]> {
  const params = new URLSearchParams({
    apikey: apiKey,
    keyword: artist,
    countryCode: "US",
    sort: "date,asc",
    size: "8",
    classificationName: "music",
  });

  const res = await fetch(
    `https://app.ticketmaster.com/discovery/v2/events.json?${params}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) return [];

  const data = (await res.json()) as {
    _embedded?: { events?: TmEvent[] };
  };

  const events = data._embedded?.events ?? [];
  const today = new Date().toISOString().slice(0, 10);

  return events
    .map((ev) => {
      const venue = ev._embedded?.venues?.[0];
      const attraction = ev._embedded?.attractions?.[0];
      const date = ev.dates?.start?.localDate ?? "";
      return {
        id: ev.id,
        eventName: ev.name,
        artist: attraction?.name ?? artist,
        venue: venue?.name ?? "Venue TBA",
        city: venue?.city?.name ?? "",
        state: venue?.state?.stateCode ?? "",
        date,
        time: ev.dates?.start?.localTime,
        url: ev.url,
      };
    })
    .filter((ev) => ev.date >= today);
}
