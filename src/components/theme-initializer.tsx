"use client";

import { useEffect } from "react";
import { applyTheme } from "@/components/theme-toggle";

export function ThemeInitializer() {
  useEffect(() => {
    const saved = localStorage.getItem("fitlog-theme");
    const theme = saved === "dark" || saved === "light" ? saved : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    applyTheme(theme);
  }, []);
  return null;
}
