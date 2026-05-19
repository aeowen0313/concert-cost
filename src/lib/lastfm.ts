export async function fetchSimilarArtists(
  artist: string,
  apiKey: string,
  limit = 5
): Promise<string[]> {
  const params = new URLSearchParams({
    method: "artist.getsimilar",
    artist,
    api_key: apiKey,
    format: "json",
    limit: String(limit),
  });

  const res = await fetch(
    `https://ws.audioscrobbler.com/2.0/?${params}`,
    { next: { revalidate: 86400 } }
  );

  if (!res.ok) return [];

  const data = (await res.json()) as {
    similarartists?: {
      artist?: Array<{ name: string }> | { name: string };
    };
  };

  const raw = data.similarartists?.artist;
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((a) => a.name).filter(Boolean);
}
