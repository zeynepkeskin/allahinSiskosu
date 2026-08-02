"use client";

import { useCallback, useEffect } from "react";

function decodeVapidKey(value: string) {
  const padded = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export function PushSubscription() {
  const sync = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return;
    const settingsResponse = await fetch("/api/reminders", { cache: "no-store" });
    const settings = await settingsResponse.json().catch(() => null) as { enabled?: boolean; vapidPublicKey?: string } | null;
    if (!settingsResponse.ok || !settings?.enabled || !settings.vapidPublicKey || Notification.permission !== "granted") return;
    const registration = await navigator.serviceWorker.register("/push-sw.js");
    const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeVapidKey(settings.vapidPublicKey) });
    await fetch("/api/push-subscriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription }) });
  }, []);

  useEffect(() => {
    void sync();
    window.addEventListener("fitlog-reminders-changed", sync);
    return () => window.removeEventListener("fitlog-reminders-changed", sync);
  }, [sync]);
  return null;
}
