"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FormField } from "@/components/FormField";

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "success",
          text: "Account created! You can log in now (check your email if confirmation is required).",
        });
        setMode("login");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        window.location.href = "/dashboard";
      }
    }
    setLoading(false);
  }

  return (
    <div className="card bg-base-100 shadow-xl w-full max-w-md">
      <div className="card-body gap-4">
        <h2 className="card-title text-2xl">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="text-sm opacity-80">
          {mode === "login"
            ? "Log in to track your concert spending and fun ratings."
            : "Sign up to start logging concerts and costs."}
        </p>

        {message ? (
          <div
            role="alert"
            className={`alert text-sm ${message.type === "error" ? "alert-error" : "alert-success"}`}
          >
            <span>{message.text}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <FormField label="Email" htmlFor="email">
            <input
              id="email"
              type="email"
              className="input input-bordered w-full"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </FormField>
          <FormField label="Password" htmlFor="password" helper="At least 6 characters">
            <input
              id="password"
              type="password"
              className="input input-bordered w-full"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </FormField>

          <button type="submit" className="btn btn-primary mt-2" disabled={loading}>
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : mode === "login" ? (
              "Log in"
            ) : (
              "Sign up"
            )}
          </button>
        </form>

        <p className="text-center text-sm">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="link link-primary"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setMessage(null);
            }}
          >
            {mode === "login" ? "Create an account" : "Log in instead"}
          </button>
        </p>
      </div>
    </div>
  );
}
