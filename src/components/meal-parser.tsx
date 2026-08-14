"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Camera } from "lucide-react";
import type { MealAnalysis } from "@/lib/nutrition";
import { Button, Spinner } from "@/components/ui";
import { moveToLocalDate, todayInTimeZone } from "@/lib/timezone";

export function MealParser({ onSaved }: { onSaved?: () => void }) {
  const [description, setDescription] = useState("");
  const [analysis, setAnalysis] = useState<MealAnalysis>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [isReadingPhoto, setIsReadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mealDate, setMealDate] = useState(() => todayInTimeZone());
  const photoInputRef = useRef<HTMLInputElement>(null);

  async function readPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(undefined);
    setIsReadingPhoto(true);
    try {
      const image = await resizeFoodPhoto(file);
      const response = await fetch("/api/ai/meal-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        description?: string;
        error?: string;
      };
      if (!response.ok || !payload.description)
        throw new Error(payload.error ?? "Could not read this photo.");
      setDescription(payload.description);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not read this photo.",
      );
    } finally {
      setIsReadingPhoto(false);
    }
  }

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
    if (!analysis || !mealDate) return;
    setError(undefined);
    setIsSaving(true);
    try {
      const response = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealName: analysis.mealName,
          items: analysis.items,
          mealTime: moveToLocalDate(new Date(), mealDate),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "Could not save eat.");
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

  function closeAnalysis() {
    setAnalysis(undefined);
    setError(undefined);
    setSaved(false);
  }

  return (
    <div className="mt-8">
      {analysis ? (
        <MealPreview
          analysis={analysis}
          isSaving={isSaving}
          onClose={closeAnalysis}
          onSave={saveMeal}
          saved={saved}
          mealDate={mealDate}
          onMealDateChange={setMealDate}
        />
      ) : (
        <form onSubmit={analyze}>
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
            <div className="mt-2 flex justify-end">
              <input
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                className="sr-only"
                onChange={readPhoto}
                ref={photoInputRef}
                type="file"
              />
              <button
                aria-label="Take a photo of your food"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading || isReadingPhoto}
                onClick={() => photoInputRef.current?.click()}
                type="button"
              >
                {isReadingPhoto ? <Spinner /> : <Camera aria-hidden size={18} />}
                {isReadingPhoto ? "Reading photo…" : "Take food photo"}
              </button>
            </div>
            {error ? (
              <p aria-live="polite" className="mt-3 text-sm text-rose-600">
                {error}
              </p>
            ) : null}
            <Button
              className="mt-4 inline-flex items-center gap-2"
              disabled={isLoading || isReadingPhoto}
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
        </form>
      )}
    </div>
  );
}

async function resizeFoodPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > 20 * 1024 * 1024)
    throw new Error("Choose a photo smaller than 20 MB.");

  const bitmap = await createImageBitmap(file);
  try {
    const maxSide = 1024;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not prepare the photo.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.65);
  } finally {
    bitmap.close();
  }
}

function MealPreview({
  analysis,
  isSaving,
  onClose,
  onSave,
  saved,
  mealDate,
  onMealDateChange,
}: {
  analysis: MealAnalysis;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
  saved: boolean;
  mealDate: string;
  onMealDateChange: (value: string) => void;
}) {
  return (
    <section
      aria-live="polite"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-emerald-600">
            NUTRITION PREVIEW
          </p>
          <button
            className="text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
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
      <div className="flex flex-wrap items-end justify-between gap-3 p-4">
        <p className="text-xs leading-5 text-slate-500">
          These values are estimates. You can edit the saved eat from your
          history.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium text-slate-700">
            Eat date
            <input
              className="mt-1 block rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
              disabled={isSaving || saved}
              onChange={(event) => onMealDateChange(event.target.value)}
              required
              type="date"
              value={mealDate}
            />
          </label>
          <Button
            disabled={isSaving || saved || !mealDate}
            onClick={onSave}
            type="button"
          >
            {saved ? "Saved" : isSaving ? "Saving…" : "Save eat"}
          </Button>
        </div>
      </div>
    </section>
  );
}
