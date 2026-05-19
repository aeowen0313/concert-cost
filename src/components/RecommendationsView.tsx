"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ArtistPreference } from "@/lib/artist-preferences";
import type { RecommendedArtist } from "@/lib/recommendations";
import type { UpcomingShow } from "@/lib/ticketmaster";
import { EmptyState } from "@/components/EmptyState";

type ArtistsResponse = {
  artists: RecommendedArtist[];
  preferences: ArtistPreference[];
  needsConcerts?: boolean;
  needsLastFm?: boolean;
  showsApiConfigured?: boolean;
};

type ShowsResponse = {
  artist: string;
  shows: UpcomingShow[];
  needsApiKey?: boolean;
  error?: string;
};

function formatShowDate(date: string, time?: string) {
  const [y, m, d] = date.split("-").map(Number);
  const formatted = new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (time) {
    const [hh, mm] = time.split(":");
    const hour = parseInt(hh, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${formatted} · ${h12}:${mm} ${ampm}`;
  }
  return formatted;
}

export function RecommendationsView() {
  const [data, setData] = useState<ArtistsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [shows, setShows] = useState<UpcomingShow[]>([]);
  const [showsLoading, setShowsLoading] = useState(false);
  const [showsError, setShowsError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/recommendations");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Could not load recommendations");
        }
        setData(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function loadShows(artistName: string) {
    setSelectedArtist(artistName);
    setShowsLoading(true);
    setShowsError(null);
    setShows([]);

    try {
      const res = await fetch(
        `/api/recommendations/shows?artist=${encodeURIComponent(artistName)}`
      );
      const body = (await res.json()) as ShowsResponse;
      if (!res.ok) {
        throw new Error(body.error ?? "Could not load shows");
      }
      setShows(body.shows ?? []);
    } catch (e) {
      setShowsError(e instanceof Error ? e.message : "Could not load shows");
    } finally {
      setShowsLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <span className="loading loading-spinner loading-lg text-primary" />
        <p className="text-sm opacity-70">Finding artists you might like…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }

  if (data?.needsConcerts) {
    return (
      <EmptyState message="Log a few concerts first — we'll suggest new artists based on who you've already seen." />
    );
  }

  if (data?.needsLastFm) {
    return (
      <div className="space-y-6">
        <div className="alert alert-info">
          <div>
            <p className="font-medium">Last.fm key needed for artist matching</p>
            <p className="text-sm mt-1">
              We compare your logged artists to similar artists you haven&apos;t seen
              yet. Location is not used — only your concert taste.
            </p>
          </div>
        </div>
        {data.preferences?.length > 0 ? (
          <section>
            <h2 className="text-lg font-semibold mb-2">Your taste profile</h2>
            <ArtistTasteList preferences={data.preferences} />
          </section>
        ) : null}
        <LastFmSetup />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="alert alert-success alert-outline text-sm">
        <span>
          Artists you <strong>haven&apos;t seen yet</strong>, picked only from who
          you&apos;ve gone to before — not from where you live. Tap an artist to see
          where they&apos;re playing.
        </span>
      </div>

      {data.preferences?.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold mb-2 opacity-80">
            Based on artists you&apos;ve seen
          </h2>
          <ArtistTasteList preferences={data.preferences} compact />
        </section>
      ) : null}

      {data.artists.length === 0 ? (
        <EmptyState message="No new artist matches right now. Log more concerts with artists you love, then check back." />
      ) : (
        <section>
          <h2 className="text-lg font-semibold mb-3">
            Recommended artists ({data.artists.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.artists.map((artist) => (
              <button
                key={artist.name}
                type="button"
                onClick={() => loadShows(artist.name)}
                className={`card bg-base-100 shadow-md text-left transition hover:shadow-lg ${
                  selectedArtist === artist.name ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="card-body gap-2 p-4">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-base">{artist.name}</h3>
                    <span className="badge badge-primary badge-sm shrink-0">
                      Match {artist.matchScore}
                    </span>
                  </div>
                  <p className="text-xs opacity-75">
                    Like {artist.basedOn} · tap for tour dates
                  </p>
                  <ul className="text-xs opacity-70 list-disc list-inside space-y-0.5">
                    {artist.matchReasons.slice(0, 2).map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedArtist ? (
        <section className="card bg-base-100 shadow-lg border border-primary/20">
          <div className="card-body gap-4">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h2 className="card-title text-lg">
                Where {selectedArtist} is playing
              </h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setSelectedArtist(null);
                  setShows([]);
                }}
              >
                Close
              </button>
            </div>

            {showsLoading ? (
              <div className="flex items-center gap-3 py-6 justify-center">
                <span className="loading loading-spinner" />
                <span className="text-sm opacity-70">Loading shows…</span>
              </div>
            ) : showsError ? (
              <div className="alert alert-warning text-sm">
                <span>{showsError}</span>
              </div>
            ) : shows.length === 0 ? (
              <p className="text-sm opacity-70 py-4">
                No upcoming US shows listed on Ticketmaster right now. Check again
                later or search the web for tour dates.
              </p>
            ) : (
              <ul className="space-y-3">
                {shows.map((show) => (
                  <li
                    key={show.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-base-200"
                  >
                    <div>
                      <p className="font-medium text-sm">{show.eventName}</p>
                      <p className="text-sm opacity-80">
                        {show.venue}
                        {show.city ? ` · ${show.city}` : ""}
                        {show.state ? `, ${show.state}` : ""}
                      </p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatShowDate(show.date, show.time)}
                      </p>
                    </div>
                    <a
                      href={show.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm w-full sm:w-auto"
                    >
                      Tickets
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {!data.showsApiConfigured ? (
        <p className="text-xs opacity-60">
          Add <code className="bg-base-200 px-1 rounded">TICKETMASTER_API_KEY</code>{" "}
          to load show locations when you tap an artist.
        </p>
      ) : null}
    </div>
  );
}

function ArtistTasteList({
  preferences,
  compact = false,
}: {
  preferences: ArtistPreference[];
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "mb-4"}`}>
      {preferences.map((p) => (
        <span key={p.artist} className="badge badge-lg badge-outline gap-1">
          {p.artist}
          <span className="opacity-60 text-xs">
            · {p.showCount} show{p.showCount > 1 ? "s" : ""} · {p.avgFun}/10
          </span>
        </span>
      ))}
    </div>
  );
}

function LastFmSetup() {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body text-sm gap-2">
        <h3 className="font-semibold">Setup (free)</h3>
        <ol className="list-decimal list-inside space-y-1 opacity-90">
          <li>
            Create a key at{" "}
            <a
              className="link link-primary"
              href="https://www.last.fm/api/account/create"
              target="_blank"
              rel="noopener noreferrer"
            >
              last.fm/api
            </a>
          </li>
          <li>
            Add{" "}
            <code className="text-xs bg-base-200 px-1 rounded">
              LASTFM_API_KEY=your_key
            </code>{" "}
            to <code className="text-xs bg-base-200 px-1 rounded">.env.local</code>{" "}
            and Vercel
          </li>
          <li>
            Optional:{" "}
            <code className="text-xs bg-base-200 px-1 rounded">
              TICKETMASTER_API_KEY
            </code>{" "}
            to show venues when you tap an artist
          </li>
          <li>Restart dev server or redeploy</li>
        </ol>
        <Link href="/add" className="btn btn-outline btn-sm w-fit mt-2">
          Add more concerts
        </Link>
      </div>
    </div>
  );
}
