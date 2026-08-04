"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { SavedMeal } from "@/lib/nutrition";
import { Button, EmptyState, Spinner } from "@/components/ui";
import { formatInTimeZone } from "@/lib/timezone";

const nutritionFields = [
  { key: "calories", label: "Calories", unit: "kcal", step: "1" },
  { key: "protein", label: "Protein", unit: "g", step: "0.1" },
  { key: "carbs", label: "Carbs", unit: "g", step: "0.1" },
  { key: "fat", label: "Fat", unit: "g", step: "0.1" },
  { key: "fiber", label: "Fiber", unit: "g", step: "0.1" },
  { key: "sugar", label: "Sugar", unit: "g", step: "0.1" },
] as const;

type NutritionField = (typeof nutritionFields)[number]["key"];

export function MealHistory({ refreshKey }: { refreshKey: number }) {
  const [meals, setMeals] = useState<SavedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [deleting, setDeleting] = useState<string>();
  const [editing, setEditing] = useState<SavedMeal>();
  const [name, setName] = useState("");
  const [items, setItems] = useState<SavedMeal["items"]>([]);
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(undefined);
      try {
        const response = await fetch("/api/meals");
        const payload = (await response.json()) as
          SavedMeal[] | { error?: string };
        if (!response.ok || !Array.isArray(payload))
          throw new Error(
            "error" in payload ? payload.error : "Could not load eats.",
          );
        if (active) setMeals(payload);
      } catch (caught) {
        if (active)
          setError(
            caught instanceof Error ? caught.message : "Could not load eats.",
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [refreshKey]);
  async function remove(meal: SavedMeal) {
    if (!window.confirm(`Delete ${meal.mealName}? This cannot be undone.`))
      return;
    setDeleting(meal.id);
    setError(undefined);
    try {
      const response = await fetch(`/api/meals/${meal.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Could not delete eat.");
      setMeals((current) => current.filter((item) => item.id !== meal.id));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not delete eat.",
      );
    } finally {
      setDeleting(undefined);
    }
  }
  function startEditing(meal: SavedMeal) {
    setEditing(meal);
    setName(meal.mealName);
    setItems(meal.items);
  }
  function updateNutrition(
    index: number,
    field: NutritionField,
    value: string,
  ) {
    const amount = Number(value);
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: Number.isFinite(amount) && amount >= 0 ? amount : 0 }
          : item,
      ),
    );
  }
  async function saveEdit() {
    if (!editing || name.trim().length < 1 || items.length === 0) return;
    setError(undefined);
    try {
      const response = await fetch(`/api/meals/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealName: name.trim(),
          items,
          mealTime: editing.mealTime,
        }),
      });
      const payload = (await response.json()) as SavedMeal | { error?: string };
      if (!response.ok || !("id" in payload))
        throw new Error(
          "error" in payload ? payload.error : "Could not update eat.",
        );
      setMeals((current) =>
        current.map((meal) => (meal.id === editing.id ? payload : meal)),
      );
      setEditing(undefined);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not update eat.",
      );
    }
  }
  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-emerald-600">HISTORY</p>
          <h2 className="mt-1 text-2xl font-bold">Saved eats</h2>
        </div>
        {loading ? <Spinner /> : null}
      </div>
      {error ? (
        <p aria-live="polite" className="mt-3 text-sm text-rose-600">
          {error}
        </p>
      ) : null}
      {!loading && meals.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="No saved eats yet"
            description="Analyze an eat above, then save it to build your history."
          />
        </div>
      ) : null}
      <div className="mt-5 space-y-3">
        {meals.map((meal) => (
          <article
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            key={meal.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-900">
                  {meal.mealName}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {formatInTimeZone(meal.mealTime, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  aria-label={`Edit ${meal.mealName}`}
                  className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => startEditing(meal)}
                  title="Edit eat"
                  type="button"
                >
                  <Pencil aria-hidden="true" className="h-4 w-4" />
                </button>
                <button
                  aria-label={`Delete ${meal.mealName}`}
                  className="grid h-8 w-8 place-items-center rounded-lg text-[0px] text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  disabled={deleting === meal.id}
                  onClick={() => void remove(meal)}
                  title="Delete eat"
                  type="button"
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                  {deleting === meal.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
              <span>
                <b>{meal.totals.calories}</b> kcal
              </span>
              <span>Protein {meal.totals.protein}g</span>
              <span>Carbs {meal.totals.carbs}g</span>
              <span>Fat {meal.totals.fat}g</span>
            </div>
          </article>
        ))}
      </div>
      {editing ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-meal-title"
        >
          <div className="max-h-[calc(100vh-2.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="edit-meal-title" className="text-xl font-bold">
              Edit eat
            </h2>
            <label
              className="mt-5 block text-sm font-medium"
              htmlFor="meal-name"
            >
              Eat name
            </label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500"
              id="meal-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <div className="mt-6 space-y-5">
              <h3 className="text-sm font-medium">Nutrition values</h3>
              {items.map((item, index) => (
                <fieldset
                  className="rounded-xl border border-slate-200 p-4"
                  key={`${item.foodName}-${item.serving}-${index}`}
                >
                  <legend className="px-1 text-sm font-semibold text-slate-900">
                    {item.foodName}
                    <span className="ml-2 font-normal text-slate-500">
                      {item.serving}
                    </span>
                  </legend>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {nutritionFields.map(({ key, label, step, unit }) => (
                      <label className="text-sm font-medium" key={key}>
                        {label}
                        <span className="ml-1 text-slate-500">({unit})</span>
                        <input
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
                          inputMode="decimal"
                          min="0"
                          onChange={(event) =>
                            updateNutrition(index, key, event.target.value)
                          }
                          step={step}
                          type="number"
                          value={item[key]}
                        />
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="text-sm font-semibold text-slate-600"
                onClick={() => setEditing(undefined)}
                type="button"
              >
                Cancel
              </button>
              <Button onClick={() => void saveEdit()} type="button">
                Save changes
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
