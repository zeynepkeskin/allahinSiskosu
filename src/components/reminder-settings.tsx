"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function ReminderSettings({ initialEnabled, initialTime }: { initialEnabled: boolean; initialTime: string }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [time, setTime] = useState(initialTime);
  const [message, setMessage] = useState<string>();
  const [saving, setSaving] = useState(false);

  async function save() {
    setMessage(undefined);
    if (enabled && !("Notification" in window)) {
      setMessage("This browser does not support notifications.");
      return;
    }
    if (enabled && !("PushManager" in window)) {
      setMessage("This browser does not support push notifications.");
      return;
    }
    if (enabled && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("Browser permission is needed to show reminders. You can enable it in your browser settings.");
        return;
      }
    }
    setSaving(true);
    const response = await fetch("/api/reminders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled, time }) });
    const body = await response.json().catch(() => ({}));
    setSaving(false);
    if (response.ok) window.dispatchEvent(new Event("fitlog-reminders-changed"));
    setMessage(response.ok ? "Reminder settings saved. This device will receive reminders after it registers for push notifications." : (body.error ?? "Could not save reminder settings."));
  }

  return (
    <div className="mt-5 space-y-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input checked={enabled} className="mt-1 h-4 w-4 accent-emerald-600" onChange={(event) => setEnabled(event.target.checked)} type="checkbox" />
        <span><span className="block text-sm font-medium text-slate-800">Evening logging reminder</span><span className="mt-1 block text-sm text-slate-500">Remind me when today has no meals logged, or when a planned workout is still incomplete.</span></span>
      </label>
      <div className="max-w-xs">
        <label className="text-sm font-medium text-slate-700" htmlFor="reminder-time">Reminder time</label>
        <input className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-emerald-500 disabled:bg-slate-100" disabled={!enabled} id="reminder-time" onChange={(event) => setTime(event.target.value)} step="900" type="time" value={time} />
      </div>
      <Button disabled={saving} onClick={save} type="button">{saving ? "Saving…" : "Save reminders"}</Button>
      {message ? <p aria-live="polite" className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
