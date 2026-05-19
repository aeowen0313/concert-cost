"use client";

import { useEffect, useState } from "react";

const THEMES = [
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "luxury",
  "dracula",
  "business",
  "night",
  "coffee",
  "winter",
  "dim",
  "nord",
  "sunset",
] as const;

const STORAGE_KEY = "concert-cost-theme";

export function ThemeSelector({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState("cupcake");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && THEMES.includes(saved as (typeof THEMES)[number])) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      document.documentElement.setAttribute("data-theme", "cupcake");
    }
  }, []);

  function handleChange(next: string) {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <label className={`form-control w-full max-w-xs ${className}`}>
      <span className="label-text text-xs font-medium">Theme</span>
      <select
        className="select select-bordered select-sm w-full"
        value={theme}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Choose app theme"
      >
        {THEMES.map((t) => (
          <option key={t} value={t}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </option>
        ))}
      </select>
    </label>
  );
}
