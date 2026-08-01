"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";
export function applyTheme(theme: Theme) { document.documentElement.dataset.theme = theme; localStorage.setItem("fitlog-theme", theme); window.dispatchEvent(new Event("fitlog-theme-change")); }

function readTheme(): Theme {
  const saved = localStorage.getItem("fitlog-theme");
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(callback: () => void) {
  window.addEventListener("fitlog-theme-change", callback);
  return () => window.removeEventListener("fitlog-theme-change", callback);
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light");
  const isDark = theme === "dark";
  return <button aria-pressed={isDark} className="mt-5 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100" onClick={() => applyTheme(isDark ? "light" : "dark")} type="button"><span>{isDark ? "Dark mode is on" : "Light mode is on"}</span><span aria-hidden="true">{isDark ? "☾" : "☀"}</span></button>;
}
