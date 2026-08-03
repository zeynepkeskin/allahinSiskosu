"use client";

import { useState, type FormEvent } from "react";
import type { MealAnalysis } from "@/lib/nutrition";
import { type DailyNutrition, recommendFood } from "@/lib/recommendations";
import { Button, Card, Spinner } from "@/components/ui";

export function CanIEatThisPanel({
  dailyGoal,
  caloriesLogged,
  nutritionLogged,
  isOpen,
  onOpen,
}: {
  dailyGoal: number | null;
  caloriesLogged: number;
  nutritionLogged: DailyNutrition;
  isOpen: boolean;
  onOpen: () => void;
}) {
  const [description, setDescription] = useState("");
  const [analysis, setAnalysis] = useState<MealAnalysis>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const recommendation = analysis
    ? recommendFood({ analysis, dailyGoal, caloriesLogged, nutritionLogged })
    : undefined;

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
      if (!response.ok || !("items" in payload)) {
        throw new Error(
          "error" in payload ? payload.error : "Could not estimate this food.",
        );
      }
      setAnalysis(payload);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not estimate this food.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function saveFood() {
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
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save this eat.");
      }
      setSaved(true);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not save this eat.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function discard() {
    setAnalysis(undefined);
    setDescription("");
    setSaved(false);
    setError(undefined);
  }

  return (
    <div className="mt-8 space-y-6">
      <Card className="bg-gradient-to-br from-emerald-50 to-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Can I eat this?</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Get a quick calorie and macro check before you log it.
            </p>
          </div>
          {!isOpen ? (
            <Button onClick={onOpen} type="button">
              Check a food
            </Button>
          ) : null}
        </div>
        {isOpen ? (
          <form className="mt-4" onSubmit={analyze}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex w-full gap-2 sm:w-auto">
                <label className="sr-only" htmlFor="food-description">
                  Food you are thinking of eating
                </label>
                <input
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 sm:w-72"
                  id="food-description"
                  maxLength={250}
                  minLength={3}
                  onChange={(event) => {
                    onOpen();
                    setDescription(event.target.value);
                  }}
                  placeholder="e.g. chicken burrito"
                  required
                  value={description}
                />
                <Button disabled={isLoading} type="submit">
                  {isLoading ? <Spinner /> : "Check"}
                </Button>
              </div>
            </div>
            {error ? (
              <p aria-live="polite" className="mt-3 text-sm text-rose-600">
                {error}
              </p>
            ) : null}
          </form>
        ) : null}
      </Card>
      {isOpen && analysis && recommendation ? (
        <RecommendationPreview
          analysis={analysis}
          isSaving={isSaving}
          onDiscard={discard}
          onSave={saveFood}
          recommendation={recommendation}
          saved={saved}
        />
      ) : null}
    </div>
  );
}

function RecommendationPreview({
  analysis,
  recommendation,
  onDiscard,
  onSave,
  isSaving,
  saved,
}: {
  analysis: MealAnalysis;
  recommendation: ReturnType<typeof recommendFood>;
  onDiscard: () => void;
  onSave: () => void;
  isSaving: boolean;
  saved: boolean;
}) {
  const colors = {
    fits: "border-emerald-200 bg-emerald-50 text-emerald-900",
    reduce: "border-amber-200 bg-amber-50 text-amber-900",
    avoid: "border-rose-200 bg-rose-50 text-rose-900",
    setup: "border-sky-200 bg-sky-50 text-sky-900",
  }[recommendation.tone];

  return (
    <Card aria-live="polite" className="overflow-hidden p-0">
      <div className="border-b border-slate-200 p-5">
        <p className="text-sm font-semibold text-emerald-600">FOOD CHECK</p>
        <h3 className="mt-1 text-xl font-bold">{analysis.mealName}</h3>
      </div>
      <div className={`m-5 rounded-xl border p-4 ${colors}`}>
        <h4 className="font-semibold">{recommendation.title}</h4>
        <p className="mt-1 text-sm leading-6">{recommendation.message}</p>
        {recommendation.nutritionNote ? (
          <p className="mt-3 border-t border-current/15 pt-3 text-sm leading-6">
            {recommendation.nutritionNote}
          </p>
        ) : null}
        {recommendation.suggestedServing ? (
          <p className="mt-2 text-sm font-semibold">
            Suggested serving: {recommendation.suggestedServing}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-5">
        {Object.entries(analysis.totals).map(([name, value]) => (
          <div className="bg-white p-4" key={name}>
            <p className="text-xs font-medium uppercase text-slate-500">
              {name}
            </p>
            <p className="mt-1 font-bold">
              {value}
              {name === "calories" ? " kcal" : " g"}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-xs leading-5 text-slate-500">
          Nutrition values are estimates. Saving adds the full estimated serving
          to today&apos;s eats.
        </p>
        <div className="flex gap-3">
          <button
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            onClick={onDiscard}
            type="button"
          >
            Delete
          </button>
          <Button disabled={isSaving || saved} onClick={onSave} type="button">
            {saved ? "Saved" : isSaving ? "Saving..." : "I ate this"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
