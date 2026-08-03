"use client";

import { useState, type FormEvent } from "react";
import type { MealAnalysis } from "@/lib/nutrition";
import { Button, Spinner } from "@/components/ui";

export function MealParser({ onSaved }: { onSaved?: () => void }) {
  const [description, setDescription] = useState("");
  const [analysis, setAnalysis] = useState<MealAnalysis>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setAnalysis(undefined);
    setSaved(false);
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const payload = (await response.json()) as
        MealAnalysis | { error?: string };
      if (!response.ok || !("items" in payload))
        throw new Error(
          "error" in payload ? payload.error : "Could not analyze this eat.",
        );
      setAnalysis(payload);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not analyze this eat.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function saveMeal() {
    if (!analysis) return;
    setError(undefined);
    setIsSaving(true);
    try {
      const response = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealName: analysis.mealName,
          items: analysis.items,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok)
        throw new Error(payload.error ?? "Could not save eat.");
      setSaved(true);
      onSaved?.();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not save eat.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={analyze}>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label
          className="text-sm font-semibold text-slate-700"
          htmlFor="meal-description"
        >
          What did you eat?
        </label>
        <textarea
          className="mt-2 min-h-32 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
          id="meal-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="e.g. Two eggs, avocado toast, and a latte"
          required
          minLength={3}
          maxLength={2000}
        />
        {error ? (
          <p aria-live="polite" className="mt-3 text-sm text-rose-600">
            {error}
          </p>
        ) : null}
        <Button
          className="mt-4 inline-flex items-center gap-2"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? (
            <>
              <Spinner /> Analyzing…
            </>
          ) : (
            "Analyze eat"
          )}
        </Button>
      </section>
      {analysis ? (
        <MealPreview
          analysis={analysis}
          isSaving={isSaving}
          onSave={saveMeal}
          saved={saved}
        />
      ) : null}
    </form>
  );
}

function MealPreview({
  analysis,
  isSaving,
  onSave,
  saved,
}: {
  analysis: MealAnalysis;
  isSaving: boolean;
  onSave: () => void;
  saved: boolean;
}) {
  return (
    <section
      aria-live="polite"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-200 p-5">
        <p className="text-sm font-semibold text-emerald-600">
          NUTRITION PREVIEW
        </p>
        <h2 className="mt-1 text-xl font-bold">{analysis.mealName}</h2>
      </div>
      <div className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-5">
        {Object.entries(analysis.totals).map(([name, value]) => (
          <div className="bg-white p-4" key={name}>
            <p className="text-xs font-medium uppercase text-slate-500">
              {name}
            </p>
            <p className="mt-1 font-bold text-slate-900">
              {value}
              {name === "calories" ? " kcal" : " g"}
            </p>
          </div>
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {analysis.items.map((item) => (
          <div
            className="flex items-center justify-between gap-4 p-4 text-sm"
            key={`${item.foodName}-${item.serving}`}
          >
            <div>
              <p className="font-semibold text-slate-800">{item.foodName}</p>
              <p className="text-slate-500">{item.serving}</p>
            </div>
            <p className="shrink-0 font-medium text-slate-700">
              {item.calories} kcal
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-xs leading-5 text-slate-500">
          These values are estimates. You can edit the saved eat from your
          history.
        </p>
        <Button disabled={isSaving || saved} onClick={onSave} type="button">
          {saved ? "Saved" : isSaving ? "Saving…" : "Save eat"}
        </Button>
      </div>
    </section>
  );
}
