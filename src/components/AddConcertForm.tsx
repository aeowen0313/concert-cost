"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FormField } from "@/components/FormField";
import { getTotalCost } from "@/lib/concert-calculations";

const emptyCosts = {
  ticket_cost: 0,
  ticket_fees: 0,
  parking_cost: 0,
  food_drink_cost: 0,
  merchandise_cost: 0,
  lodging_cost: 0,
  travel_cost: 0,
  other_cost: 0,
};

const initial = {
  concert_name: "",
  artist: "",
  venue: "",
  city: "",
  state: "",
  concert_date: "",
  distance_from_home: "",
  hours_at_event: "",
  notes: "",
  fun_rating: 7,
  ...emptyCosts,
};

type FormState = typeof initial;

function num(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function AddConcertForm() {
  const [form, setForm] = useState<FormState>(initial);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewTotal = useMemo(() => {
    return getTotalCost({
      ticket_cost: num(String(form.ticket_cost)),
      ticket_fees: num(String(form.ticket_fees)),
      parking_cost: num(String(form.parking_cost)),
      food_drink_cost: num(String(form.food_drink_cost)),
      merchandise_cost: num(String(form.merchandise_cost)),
      lodging_cost: num(String(form.lodging_cost)),
      travel_cost: num(String(form.travel_cost)),
      other_cost: num(String(form.other_cost)),
    });
  }, [form]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please log in again.");
      setLoading(false);
      return;
    }

    const hours = num(form.hours_at_event);
    if (hours <= 0) {
      setError("Hours at the event must be greater than zero.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("concerts").insert({
      user_id: user.id,
      concert_name: form.concert_name.trim(),
      artist: form.artist.trim(),
      venue: form.venue.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      concert_date: form.concert_date,
      distance_from_home: num(form.distance_from_home),
      hours_at_event: hours,
      ticket_cost: num(String(form.ticket_cost)),
      ticket_fees: num(String(form.ticket_fees)),
      parking_cost: num(String(form.parking_cost)),
      food_drink_cost: num(String(form.food_drink_cost)),
      merchandise_cost: num(String(form.merchandise_cost)),
      lodging_cost: num(String(form.lodging_cost)),
      travel_cost: num(String(form.travel_cost)),
      other_cost: num(String(form.other_cost)),
      fun_rating: form.fun_rating,
      notes: form.notes.trim() || null,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setForm(initial);
    setSuccess(true);
  }

  const costFields: { key: keyof typeof emptyCosts; label: string }[] = [
    { key: "ticket_cost", label: "Ticket cost" },
    { key: "ticket_fees", label: "Ticket fees" },
    { key: "parking_cost", label: "Parking" },
    { key: "food_drink_cost", label: "Food & drink" },
    { key: "merchandise_cost", label: "Merchandise" },
    { key: "lodging_cost", label: "Hotel / lodging" },
    { key: "travel_cost", label: "Travel / gas" },
    { key: "other_cost", label: "Other" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {success ? (
        <div role="alert" className="alert alert-success">
          <span>Concert saved! Your dashboard will update with this show.</span>
        </div>
      ) : null}
      {error ? (
        <div role="alert" className="alert alert-error">
          <span>{error}</span>
        </div>
      ) : null}

      <section className="card bg-base-100 shadow">
        <div className="card-body gap-4">
          <h2 className="card-title text-lg">Concert details</h2>
          <FormField label="Concert name" htmlFor="concert_name">
            <input
              id="concert_name"
              className="input input-bordered w-full"
              value={form.concert_name}
              onChange={(e) => update("concert_name", e.target.value)}
              required
            />
          </FormField>
          <FormField label="Artist / band" htmlFor="artist">
            <input
              id="artist"
              className="input input-bordered w-full"
              value={form.artist}
              onChange={(e) => update("artist", e.target.value)}
              required
            />
          </FormField>
          <FormField label="Venue" htmlFor="venue">
            <input
              id="venue"
              className="input input-bordered w-full"
              value={form.venue}
              onChange={(e) => update("venue", e.target.value)}
              required
            />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="City" htmlFor="city">
              <input
                id="city"
                className="input input-bordered w-full"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                required
              />
            </FormField>
            <FormField label="State" htmlFor="state">
              <input
                id="state"
                className="input input-bordered w-full"
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
                required
              />
            </FormField>
          </div>
          <FormField label="Concert date" htmlFor="concert_date">
            <input
              id="concert_date"
              type="date"
              className="input input-bordered w-full"
              value={form.concert_date}
              onChange={(e) => update("concert_date", e.target.value)}
              required
            />
          </FormField>
          <FormField
            label="Distance (miles)"
            htmlFor="distance_from_home"
            helper="How far you traveled from home"
          >
            <input
              id="distance_from_home"
              type="number"
              min="0"
              step="0.1"
              className="input input-bordered w-full"
              value={form.distance_from_home}
              onChange={(e) => update("distance_from_home", e.target.value)}
              required
            />
          </FormField>
          <FormField
            label="Hours at event"
            htmlFor="hours_at_event"
            helper="Include travel time at the venue if you like"
          >
            <input
              id="hours_at_event"
              type="number"
              min="0.5"
              step="0.5"
              className="input input-bordered w-full"
              value={form.hours_at_event}
              onChange={(e) => update("hours_at_event", e.target.value)}
              required
            />
          </FormField>
          <FormField label="Notes" htmlFor="notes" helper="Optional memories or tips">
            <textarea
              id="notes"
              className="textarea textarea-bordered w-full"
              rows={3}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </FormField>
        </div>
      </section>

      <section className="card bg-base-100 shadow">
        <div className="card-body gap-4">
          <h2 className="card-title text-lg">Costs</h2>
          <p className="text-sm opacity-70">Enter amounts in dollars. Leave blank for $0.</p>
          {costFields.map(({ key, label }) => (
            <FormField key={key} label={label} htmlFor={key}>
              <input
                id={key}
                type="number"
                min="0"
                step="0.01"
                className="input input-bordered w-full"
                value={form[key]}
                onChange={(e) =>
                  update(key, e.target.value === "" ? 0 : parseFloat(e.target.value))
                }
              />
            </FormField>
          ))}
          <div className="stats shadow bg-primary text-primary-content mt-2">
            <div className="stat">
              <div className="stat-title text-primary-content/80">Estimated total</div>
              <div className="stat-value text-2xl">
                ${previewTotal.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card bg-base-100 shadow">
        <div className="card-body gap-4">
          <h2 className="card-title text-lg">How fun was it?</h2>
          <FormField label="Fun rating" htmlFor="fun_rating">
            <div className="space-y-2">
              <input
                id="fun_rating"
                type="range"
                min={1}
                max={10}
                value={form.fun_rating}
                onChange={(e) => update("fun_rating", Number(e.target.value))}
                className="range range-primary"
              />
              <div className="flex justify-between text-xs opacity-70 px-1">
                <span>1 — Terrible Time</span>
                <span className="font-bold text-base">{form.fun_rating}</span>
                <span>10 — Best Time Ever</span>
              </div>
            </div>
          </FormField>
        </div>
      </section>

      <button type="submit" className="btn btn-primary btn-lg w-full sm:w-auto" disabled={loading}>
        {loading ? <span className="loading loading-spinner" /> : "Save concert"}
      </button>
    </form>
  );
}
