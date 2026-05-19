"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ArtistPreference } from "@/lib/artist-preferences";
import type { RecommendedShow } from "@/lib/recommendations";
import { EmptyState } from "@/components/EmptyState";

type ApiResponse = {
  recommendations: RecommendedShow[];
  preferences: ArtistPreference[];
  needsConcerts?: boolean;
  needsApiKey?: boolean;
  apiConfigured?: boolean;
  similarArtistsEnabled?: boolean;
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

const sourceBadge: Record<RecommendedShow["source"], string> = {
  repeat: "badge-primary",
  similar: "badge-secondary",
  region: "badge-accent",
};

const sourceLabel: Record<RecommendedShow["source"], string> = {
  repeat: "Artist you've seen",
  similar: "Similar taste",
  region: "Your region",
};

export function RecommendationsView() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <span className="loading loading-spinner loading-lg text-primary" />
        <p className="text-sm opacity-70">Finding shows you might like…</p>
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
      <EmptyState message="Log a few concerts first — we'll use the artists you've seen to predict shows you'd enjoy." />
    );
  }

  if (data?.needsApiKey) {
    return (
      <div className="space-y-6">
        <div className="alert alert-info">
          <div>
            <p className="font-medium">Connect live concert data</p>
            <p className="text-sm mt-1">
              Add a free Ticketmaster API key to see real upcoming shows. Until then,
              here are the artists our model thinks you care about most:
            </p>
          </div>
        </div>
        <ArtistTasteList preferences={data.preferences} />
        <SetupInstructions />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="alert alert-success alert-outline text-sm">
        <span>
          Picks are based on artists you&apos;ve seen, how much fun you rated them,
          places you&apos;ve traveled for shows
          {data?.similarArtistsEnabled ? ", and similar artists" : ""}.
        </span>
      </div>

      {data?.preferences && data.preferences.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold mb-3">Your top artists</h2>
          <ArtistTasteList preferences={data.preferences} compact />
        </section>
      ) : null}

      {data?.recommendations.length === 0 ? (
        <EmptyState message="No upcoming shows found right now for your artists. Check back later — tours get announced all the time!" />
      ) : (
        <section>
          <h2 className="text-lg font-semibold mb-3">
            Upcoming shows you might attend ({data.recommendations.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {data.recommendations.map((show) => (
              <article key={show.id} className="card bg-base-100 shadow-md">
                <div className="card-body gap-2">
                  <div className="flex flex-wrap justify-between gap-2 items-start">
                    <h3 className="card-title text-base leading-tight">
                      {show.artist}
                    </h3>
                    <span className={`badge badge-sm ${sourceBadge[show.source]}`}>
                      {sourceLabel[show.source]}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{show.eventName}</p>
                  <p className="text-sm opacity-80">
                    {show.venue}
                    {show.city ? ` · ${show.city}` : ""}
                    {show.state ? `, ${show.state}` : ""}
                  </p>
                  <p className="text-sm">{formatShowDate(show.date, show.time)}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="badge badge-outline badge-sm">
                      Match score: {show.matchScore}
                    </span>
                  </div>
                  <ul className="text-xs opacity-75 list-disc list-inside mt-1 space-y-0.5">
                    {show.matchReasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                  <div className="card-actions justify-end mt-2">
                    <a
                      href={show.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                    >
                      View tickets
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
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
            · {p.showCount} show{p.showCount > 1 ? "s" : ""} · {p.avgFun}/10 fun
          </span>
        </span>
      ))}
    </div>
  );
}

function SetupInstructions() {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body text-sm gap-2">
        <h3 className="font-semibold">Enable predictions (free)</h3>
        <ol className="list-decimal list-inside space-y-1 opacity-90">
          <li>
            Sign up at{" "}
            <a
              className="link link-primary"
              href="https://developer.ticketmaster.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              developer.ticketmaster.com
            </a>{" "}
            and create an API key.
          </li>
          <li>
            Add to <code className="text-xs bg-base-200 px-1 rounded">.env.local</code>{" "}
            and Vercel env vars:{" "}
            <code className="text-xs bg-base-200 px-1 rounded">TICKETMASTER_API_KEY=your_key</code>
          </li>
          <li>
            Optional: add{" "}
            <code className="text-xs bg-base-200 px-1 rounded">LASTFM_API_KEY</code> from{" "}
            <a
              className="link link-primary"
              href="https://www.last.fm/api/account/create"
              target="_blank"
              rel="noopener noreferrer"
            >
              last.fm
            </a>{" "}
            for similar-artist suggestions.
          </li>
          <li>Restart dev server or redeploy on Vercel.</li>
        </ol>
        <Link href="/add" className="btn btn-outline btn-sm w-fit mt-2">
          Add more concerts
        </Link>
      </div>
    </div>
  );
}
