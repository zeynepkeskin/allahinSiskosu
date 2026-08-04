"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button, Card, EmptyState } from "@/components/ui";
import { addCalendarDays, todayInTimeZone } from "@/lib/timezone";
export type WeightEntry = { id: string; weight: number; date: string };
type Range = "week" | "month";
const today = todayInTimeZone;
const displayDate = (date: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    new Date(`${date}T12:00:00`),
  );

export function WeightTracker({
  initialEntries,
  targetWeight,
}: {
  initialEntries: WeightEntry[];
  targetWeight?: number;
}) {
  const [entries, setEntries] = useState(initialEntries),
    [weight, setWeight] = useState(initialEntries[0]?.weight.toString() ?? ""),
    [date, setDate] = useState(today()),
    [editing, setEditing] = useState<string>(),
    [range, setRange] = useState<Range>("week"),
    [message, setMessage] = useState<string>(),
    [saving, setSaving] = useState(false);
  const chartEntries = useMemo(() => {
    const cutoff = addCalendarDays(today(), range === "week" ? -6 : -29);
    return entries
      .filter((entry) => entry.date >= cutoff)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [entries, range]);
  const delta =
    entries.length > 1
      ? entries[0].weight - entries[entries.length - 1].weight
      : null;
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(undefined);
    const value = Number(weight);
    if (!Number.isFinite(value) || value < 55 || value > 1100) {
      setMessage("Enter a weight between 55 and 1,100 lb.");
      return;
    }
    setSaving(true);
    const response = await fetch(
      editing ? `/api/weights/${editing}` : "/api/weights",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight: value, date }),
      },
    );
    const body = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setMessage(body.error ?? "Could not save weight entry.");
      return;
    }
    setEntries((current) =>
      [
        body,
        ...current.filter(
          (entry) => entry.id !== body.id && entry.date !== body.date,
        ),
      ].sort((a, b) => b.date.localeCompare(a.date)),
    );
    setWeight("");
    setDate(today());
    setEditing(undefined);
    setMessage(
      body.profileSyncError
        ? "Weight entry saved, but your profile could not be updated."
        : typeof body.dailyCalorieGoal === "number"
          ? `Weight entry saved. Your daily calorie goal is now ${body.dailyCalorieGoal} kcal.`
          : "Weight entry saved.",
    );
  }
  function beginEdit(entry: WeightEntry) {
    setEditing(entry.id);
    setWeight(entry.weight.toString());
    setDate(entry.date);
    setMessage(undefined);
  }
  async function remove(id: string) {
    if (!window.confirm("Delete this weight entry?")) return;
    const response = await fetch(`/api/weights/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("Could not delete weight entry.");
      return;
    }
    setEntries((current) => current.filter((entry) => entry.id !== id));
    setMessage("Weight entry deleted.");
  }
  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-5">
      <Card className="xl:col-span-2">
        <h2 className="font-semibold">Log your weight</h2>
        <p className="mt-1 text-sm text-slate-500">
          One entry per day. Saving the same date updates it.
        </p>
        <form className="mt-5 space-y-4" onSubmit={submit}>
          <div>
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="weight"
            >
              Weight (lb)
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500"
              id="weight"
              min="55"
              max="1100"
              step="0.1"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="weight-date"
            >
              Date
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500"
              id="weight-date"
              type="date"
              value={date}
              max={today()}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          {message ? (
            <p aria-live="polite" className="text-sm text-slate-600">
              {message}
            </p>
          ) : null}
          <div className="flex gap-3">
            <Button disabled={saving} type="submit">
              {saving ? "Saving…" : editing ? "Update weight" : "Save weight"}
            </Button>
            {editing ? (
              <button
                className="text-sm font-semibold text-slate-600"
                onClick={() => {
                  setEditing(undefined);
                  setWeight("");
                  setDate(today());
                }}
                type="button"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
        <div className="mt-7 border-t border-slate-100 pt-5">
          <p className="text-sm text-slate-500">Latest weight</p>
          <p className="mt-1 text-2xl font-bold">
            {entries[0] ? `${entries[0].weight.toFixed(1)} lb` : "—"}
          </p>
          {delta !== null ? (
            <p className="mt-1 text-sm text-slate-500">
              {delta === 0
                ? "No change"
                : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} lb`}{" "}
              since first entry
            </p>
          ) : null}
        </div>
      </Card>
      <Card className="xl:col-span-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Weight trend</h2>
            <p className="mt-1 text-sm text-slate-500">
              Your logged weights over time.
            </p>
          </div>
          <div className="flex rounded-lg bg-slate-100 p-1 text-sm">
            <button
              className={`rounded-md px-3 py-1.5 ${range === "week" ? "bg-white font-semibold shadow-sm" : "text-slate-500"}`}
              onClick={() => setRange("week")}
              type="button"
            >
              Week
            </button>
            <button
              className={`rounded-md px-3 py-1.5 ${range === "month" ? "bg-white font-semibold shadow-sm" : "text-slate-500"}`}
              onClick={() => setRange("month")}
              type="button"
            >
              Month
            </button>
          </div>
        </div>
        <WeightChart entries={chartEntries} targetWeight={targetWeight} />
      </Card>
      <section className="xl:col-span-5">
        <h2 className="mb-4 font-semibold">Weight history</h2>
        {entries.length === 0 ? (
          <EmptyState
            title="No weight entries yet"
            description="Log your weight to see weekly and monthly progress."
          />
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="divide-y divide-slate-100">
              {entries.map((entry) => (
                <div
                  className="flex items-center justify-between gap-4 px-5 py-4"
                  key={entry.id}
                >
                  <div>
                    <p className="font-semibold">
                      {entry.weight.toFixed(1)} lb
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {displayDate(entry.date)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      aria-label={`Edit weight entry for ${displayDate(entry.date)}`}
                      className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => beginEdit(entry)}
                      title="Edit weight entry"
                      type="button"
                    >
                      <Pencil aria-hidden="true" className="h-4 w-4" />
                    </button>
                    <button
                      aria-label={`Delete weight entry for ${displayDate(entry.date)}`}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      onClick={() => remove(entry.id)}
                      title="Delete weight entry"
                      type="button"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
function WeightChart({
  entries,
  targetWeight,
}: {
  entries: WeightEntry[];
  targetWeight?: number;
}) {
  if (!entries.length)
    return (
      <div className="grid h-64 place-items-center text-center text-sm text-slate-500">
        Log a weight entry in this period to see your trend.
      </div>
    );
  const values = [
      ...entries.map((entry) => entry.weight),
      ...(typeof targetWeight === "number" ? [targetWeight] : []),
    ],
    rawMin = Math.min(...values),
    rawMax = Math.max(...values),
    padding = Math.max((rawMax - rawMin) * 0.15, 1),
    min = rawMin - padding,
    max = rawMax + padding,
    spread = max - min,
    width = 640,
    height = 220,
    left = 42,
    right = 12,
    top = 14,
    bottom = 28,
    plotWidth = width - left - right,
    plotHeight = height - top - bottom,
    x = (index: number) =>
      left +
      (entries.length === 1
        ? plotWidth / 2
        : (index / (entries.length - 1)) * plotWidth),
    y = (value: number) => top + ((max - value) / spread) * plotHeight,
    line = entries
      .map((entry, index) => `${x(index)},${y(entry.weight)}`)
      .join(" ");
  return (
    <div className="mt-7">
      <svg
        aria-label={`Weight line chart${typeof targetWeight === "number" ? ` with a ${targetWeight.toFixed(1)} pound goal line` : ""}`}
        className="h-auto w-full"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <line
          className="stroke-slate-200"
          x1={left}
          x2={width - right}
          y1={y(min)}
          y2={y(min)}
        />
        <text
          className="fill-slate-500 text-[11px]"
          textAnchor="end"
          x={left - 7}
          y={top + 4}
        >
          {max.toFixed(1)}
        </text>
        <text
          className="fill-slate-500 text-[11px]"
          textAnchor="end"
          x={left - 7}
          y={y(min) + 4}
        >
          {min.toFixed(1)}
        </text>
        {typeof targetWeight === "number" ? (
          <>
            <line
              className="stroke-orange-500"
              strokeDasharray="6 5"
              x1={left}
              x2={width - right}
              y1={y(targetWeight)}
              y2={y(targetWeight)}
            />
            <text
              className="fill-orange-600 text-[11px]"
              textAnchor="end"
              x={width - right}
              y={y(targetWeight) - 6}
            >
              Goal {targetWeight.toFixed(1)} lb
            </text>
          </>
        ) : null}
        <polyline
          fill="none"
          points={line}
          stroke="#10b981"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        {entries.map((entry, index) => (
          <g key={entry.id}>
            <circle
              className="fill-white stroke-emerald-600"
              cx={x(index)}
              cy={y(entry.weight)}
              r="4.5"
              strokeWidth="3"
            >
              <title>{`${displayDate(entry.date)}: ${entry.weight.toFixed(1)} lb`}</title>
            </circle>
            <text
              className="fill-slate-500 text-[11px]"
              textAnchor="middle"
              x={x(index)}
              y={height - 7}
            >
              {displayDate(entry.date)}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-3 flex justify-between text-xs text-slate-500">
        <span>{displayDate(entries[0].date)}</span>
        <span>
          {entries.length === 1
            ? `${entries[0].weight.toFixed(1)} lb`
            : `${min.toFixed(1)}–${max.toFixed(1)} lb`}
        </span>
        <span>{displayDate(entries[entries.length - 1].date)}</span>
      </div>
    </div>
  );
}
