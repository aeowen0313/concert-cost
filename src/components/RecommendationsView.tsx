"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ArtistPreference } from "@/lib/artist-preferences";
import type { RecommendedArtist } from "@/lib/recommendations";
import type { UpcomingShow } from "@/lib/ticketmaster";
import { EmptyState } from "@/components/EmptyState";

type ArtistsResponse = {
  artists: RecommendedArtist[];
  preferences: ArtistPreference[];
  needsConcerts?: boolean;
  needsApiKey?: boolean;
};

type ShowsResponse = {
  artist: string;
  shows: UpcomingShow[];
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

function ArtistShowsPanel({
  artist,
  attractionId,
}: {
  artist: RecommendedArtist;
  attractionId?: string;
}) {
  const [shows, setShows] = useState<UpcomingShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ artist: artist.name });
        if (attractionId) params.set("attractionId", attractionId);

        const res = await fetch(`/api/recommendations/shows?${params}`);
        const body = (await res.json()) as ShowsResponse;
        if (!res.ok) {
          throw new Error(body.error ?? "Could not load shows");
        }
        if (!cancelled) setShows(body.shows ?? []);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load shows");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [artist.name, attractionId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 px-2 border-t border-base-300">
        <span className="loading loading-spinner loading-sm" />
        <span className="text-sm opacity-70">Loading tour dates…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-warning text-sm m-2">
        <span>{error}</span>
      </div>
    );
  }

  if (shows.length === 0) {
    return (
      <p className="text-sm opacity-70 py-3 px-2 border-t border-base-300">
        No upcoming US shows on Ticketmaster right now. Try again later or search
        online for &ldquo;{artist.name} tour dates&rdquo;.
      </p>
    );
  }

  return (
    <ul className="border-t border-base-300 divide-y divide-base-300">
      {shows.map((show) => (
        <li key={show.id} className="p-3 flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{show.eventName}</p>
            <p className="text-sm opacity-80">
              {show.venue}
              {show.city ? ` · ${show.city}` : ""}
              {show.state ? `, ${show.state}` : ""}
            </p>
            <p className="text-xs opacity-70 mt-0.5">
              {formatShowDate(show.date, show.time)}
            </p>
          </div>
          <a
            href={show.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm shrink-0"
          >
            Tickets
          </a>
        </li>
      ))}
    </ul>
  );
}

export function RecommendationsView() {
  const [data, setData] = useState<ArtistsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

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

  function toggleArtist(artist: RecommendedArtist) {
    const next = expandedArtist === artist.name ? null : artist.name;
    setExpandedArtist(next);
    if (next) {
      requestAnimationFrame(() => {
        document.getElementById(`artist-${normalizeId(artist.name)}`)?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      });
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

  if (data?.needsApiKey) {
    return (
      <div className="space-y-6">
        <div className="alert alert-info">
          <div>
            <p className="font-medium">Ticketmaster key needed</p>
            <p className="text-sm mt-1">
              We use Ticketmaster for artist matching and tour dates. No Last.fm
              account required.
            </p>
          </div>
        </div>
        {data.preferences?.length > 0 ? (
          <section>
            <h2 className="text-lg font-semibold mb-2">Your taste profile</h2>
            <ArtistTasteList preferences={data.preferences} />
          </section>
        ) : null}
        <TicketmasterSetup />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6" ref={listRef}>
      <div className="alert alert-success alert-outline text-sm">
        <span>
          Tap <strong>See tour dates</strong> on any artist to expand shows below
          that card. Matches are based on music style from concerts you&apos;ve
          logged — not your location.
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
            {data.artists.map((artist) => {
              const isOpen = expandedArtist === artist.name;
              return (
                <div
                  key={artist.name}
                  id={`artist-${normalizeId(artist.name)}`}
                  className={`card bg-base-100 shadow-md overflow-hidden ${
                    isOpen ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="card-body gap-2 p-4">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-semibold text-base">{artist.name}</h3>
                      <span className="badge badge-primary badge-sm shrink-0">
                        Match {artist.matchScore}
                      </span>
                    </div>
                    <p className="text-xs opacity-75">Like {artist.basedOn}</p>
                    <ul className="text-xs opacity-70 list-disc list-inside space-y-0.5">
                      {artist.matchReasons.slice(0, 2).map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className={`btn btn-sm w-full mt-2 ${isOpen ? "btn-primary" : "btn-outline btn-primary"}`}
                      onClick={() => toggleArtist(artist)}
                      aria-expanded={isOpen}
                    >
                      {isOpen ? "Hide tour dates" : "See tour dates"}
                    </button>
                  </div>
                  {isOpen ? (
                    <ArtistShowsPanel
                      artist={artist}
                      attractionId={artist.attractionId}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function normalizeId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
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

function TicketmasterSetup() {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body text-sm gap-2">
        <h3 className="font-semibold">Setup (free)</h3>
        <ol className="list-decimal list-inside space-y-1 opacity-90">
          <li>
            Get a key at{" "}
            <a
              className="link link-primary"
              href="https://developer.ticketmaster.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              developer.ticketmaster.com
            </a>
          </li>
          <li>
            Add{" "}
            <code className="text-xs bg-base-200 px-1 rounded">
              TICKETMASTER_API_KEY=your_key
            </code>{" "}
            to <code className="text-xs bg-base-200 px-1 rounded">.env.local</code>{" "}
            and Vercel
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
