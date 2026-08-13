"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useState } from "react";
import { ListFilter, X } from "lucide-react";
import {
  ExerciseMuscleFilter,
  ExerciseMuscleMap,
} from "@/components/exercise-visuals";
import {
  demoFrames,
  equipmentChoices,
  type EquipmentId,
  exerciseGroups,
  getExerciseVisual,
  muscleLabels,
  type MuscleId,
  popularityChoices,
  type ExercisePopularity,
} from "@/lib/exercise-catalog";

export function ExerciseSelector({
  value,
  label,
  onChange,
}: {
  value: string;
  label: string;
  onChange: (value: string) => void;
}) {
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState<string>();
  const [candidate, setCandidate] = useState<string>();
  const [frame, setFrame] = useState<"start" | "finish">("start");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [popularity, setPopularity] = useState<ExercisePopularity | "all">(
    "all",
  );
  const [equipment, setEquipment] = useState<EquipmentId | "all">("all");
  const [muscle, setMuscle] = useState<MuscleId>();
  const visual = candidate ? getExerciseVisual(candidate) : undefined;
  const filteredGroups = useMemo(
    () =>
      exerciseGroups
        .map((item) => ({
          ...item,
          exercises: item.exercises.filter((name) => {
            const exercise = getExerciseVisual(name);
            return (
              (popularity === "all" || exercise.popularity === popularity) &&
              (equipment === "all" || exercise.equipment.includes(equipment)) &&
              (!muscle ||
                exercise.primary.includes(muscle) ||
                exercise.secondary.includes(muscle))
            );
          }),
        }))
        .filter((item) => item.exercises.length > 0),
    [equipment, muscle, popularity],
  );

  useEffect(() => {
    if (!open || !visual?.demoId) return;
    const timer = window.setInterval(
      () => setFrame((current) => (current === "start" ? "finish" : "start")),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [open, visual?.demoId]);

  function show() {
    setGroup(undefined);
    setCandidate(undefined);
    setFrame("start");
    setFiltersOpen(false);
    setOpen(true);
  }
  function chooseGroup(nextGroup: string) {
    setGroup(nextGroup);
    setCandidate(undefined);
    setFrame("start");
  }
  function chooseExercise(name: string) {
    setCandidate(name);
    setFrame("start");
  }
  function select() {
    if (!candidate) return;
    onChange(candidate);
    setOpen(false);
  }
  const frames = visual?.demoId ? demoFrames(visual.demoId) : undefined;

  return (
    <>
      <div className="mt-3">
        <label
          className="block text-xs font-medium text-slate-600"
          htmlFor={inputId}
        >
          {label}
        </label>
        <div className="mt-1 flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            id={inputId}
            placeholder="Choose an exercise"
            readOnly
            value={value}
          />
          <button
            aria-haspopup="dialog"
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            onClick={show}
            type="button"
          >
            {value ? "Change" : "Browse"}
          </button>
        </div>
      </div>
      {open ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end bg-slate-950/45 p-3 sm:items-center sm:justify-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
          role="dialog"
        >
          <section className="flex h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:h-[92dvh] xl:h-[min(46rem,88vh)]">
            <header className="relative z-10 flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-emerald-700">
                  EXERCISE LIBRARY
                </p>
                <h2 className="mt-1 text-xl font-bold">Choose an exercise</h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  aria-expanded={filtersOpen}
                  aria-label="Filter exercise library"
                  className={`relative grid h-9 w-9 place-items-center rounded-lg ${filtersOpen ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-100"}`}
                  onClick={() => setFiltersOpen((current) => !current)}
                  type="button"
                >
                  <ListFilter aria-hidden="true" className="h-5 w-5" />
                  {[
                    popularity !== "all",
                    equipment !== "all",
                    Boolean(muscle),
                  ].filter(Boolean).length ? (
                    <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
                      {
                        [
                          popularity !== "all",
                          equipment !== "all",
                          Boolean(muscle),
                        ].filter(Boolean).length
                      }
                    </span>
                  ) : null}
                </button>
                <button
                  aria-label="Close exercise selector"
                  className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
              {filtersOpen ? (
                <div className="absolute right-3 top-[calc(100%+0.5rem)] z-20 w-[calc(100vw-2.5rem)] max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-slate-900">
                      Filter exercises
                    </h3>
                    <button
                      className="text-xs font-semibold text-emerald-700 disabled:text-slate-400"
                      disabled={
                        popularity === "all" && equipment === "all" && !muscle
                      }
                      onClick={() => {
                        setPopularity("all");
                        setEquipment("all");
                        setMuscle(undefined);
                        setGroup(undefined);
                        setCandidate(undefined);
                      }}
                      type="button"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <FilterSelect
                      label="Popularity"
                      onChange={(next) => {
                        setPopularity(next as ExercisePopularity | "all");
                        setGroup(undefined);
                        setCandidate(undefined);
                      }}
                      options={popularityChoices}
                      value={popularity}
                    />
                    <FilterSelect
                      label="Equipment"
                      onChange={(next) => {
                        setEquipment(next as EquipmentId | "all");
                        setGroup(undefined);
                        setCandidate(undefined);
                      }}
                      options={equipmentChoices}
                      value={equipment}
                    />
                  </div>
                  <div className="mt-4">
                    <ExerciseMuscleFilter
                      onChange={(next) => {
                        setMuscle(next);
                        setGroup(undefined);
                        setCandidate(undefined);
                      }}
                      value={muscle}
                    />
                  </div>
                </div>
              ) : null}
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <FilterSummary
                equipment={equipment}
                muscle={muscle}
                popularity={popularity}
              />
              {!group ? (
                filteredGroups.length ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {filteredGroups.map((item) => (
                      <button
                        className="rounded-xl border border-slate-200 p-4 text-left font-semibold text-slate-800 transition hover:border-emerald-400 hover:bg-emerald-50"
                        key={item.label}
                        onClick={() => chooseGroup(item.label)}
                        type="button"
                      >
                        {item.label}
                        <span className="mt-1 block text-sm font-normal text-slate-500">
                          {item.exercises.length} exercises
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center">
                    <p className="font-semibold text-slate-700">
                      No exercises match these filters.
                    </p>
                    <button
                      className="mt-2 text-sm font-semibold text-emerald-700"
                      onClick={() => {
                        setPopularity("all");
                        setEquipment("all");
                        setMuscle(undefined);
                      }}
                      type="button"
                    >
                      Clear filters
                    </button>
                  </div>
                )
              ) : !candidate ? (
                <>
                  <button
                    className="text-sm font-semibold text-emerald-700"
                    onClick={() => setGroup(undefined)}
                    type="button"
                  >
                    ← All groups
                  </button>
                  <h3 className="mt-3 font-semibold">{group}</h3>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {filteredGroups
                      .find((item) => item.label === group)
                      ?.exercises.map((name) => (
                        <button
                          className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:border-emerald-400 hover:bg-emerald-50"
                          key={name}
                          onClick={() => chooseExercise(name)}
                          type="button"
                        >
                          <span className="block">{name}</span>
                          <ExerciseDetails name={name} />
                        </button>
                      ))}
                  </div>
                </>
              ) : (
                <>
                  <button
                    className="text-sm font-semibold text-emerald-700"
                    onClick={() => setCandidate(undefined)}
                    type="button"
                  >
                    ← {group}
                  </button>
                  <h3 className="mt-3 text-2xl font-bold">{candidate}</h3>
                  <ExerciseDetails name={candidate} />
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <p className="border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Movement preview
                      </p>
                      {frames ? (
                        <>
                          <Image
                            alt={`${candidate}: ${frame} position`}
                            className="aspect-[4/3] w-full p-3 object-contain"
                            height={360}
                            priority
                            src={frames[frame]}
                            width={480}
                          />
                          <p className="border-t border-slate-200 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
                            {frame} position
                          </p>
                        </>
                      ) : (
                        <p className="p-6 text-sm text-slate-500">
                          Movement frames are not available for this exercise
                          yet.
                        </p>
                      )}
                    </section>
                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <p className="border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Target muscles
                      </p>
                      <ExerciseMuscleMap visual={visual} />
                    </section>
                  </div>
                </>
              )}
            </div>
            <footer className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4">
              <button
                className="text-sm font-semibold text-slate-600"
                onClick={() => setOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={!candidate}
                onClick={select}
                type="button"
              >
                Select exercise
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}

function FilterSummary({
  popularity,
  equipment,
  muscle,
}: {
  popularity: ExercisePopularity | "all";
  equipment: EquipmentId | "all";
  muscle?: MuscleId;
}) {
  const popularityLabel = popularityChoices
    .find(([value]) => value === popularity)?.[1]
    .toLowerCase();
  const equipmentLabel = equipmentChoices
    .find(([value]) => value === equipment)?.[1]
    .toLowerCase();
  const parts = [
    popularityLabel,
    equipmentLabel ? `using ${equipmentLabel}` : undefined,
    muscle ? `for the ${muscleLabels[muscle].toLowerCase()}` : undefined,
  ].filter(Boolean);

  return (
    <p aria-live="polite" className="text-sm text-slate-600">
      {parts.length
        ? `Listing ${parts.join(" ")} exercises.`
        : "Listing all exercises."}
    </p>
  );
}

function ExerciseDetails({ name }: { name: string }) {
  const exercise = getExerciseVisual(name);
  const popularity = popularityChoices.find(
    ([value]) => value === exercise.popularity,
  )?.[1];
  const equipment = exercise.equipment
    .map((id) => equipmentChoices.find(([value]) => value === id)?.[1])
    .join(", ");
  return (
    <span className="mt-1 block text-xs font-normal text-slate-500">
      {popularity} · {equipment}
    </span>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly (readonly [string, string])[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-xs font-semibold text-slate-600">
      {label}
      <select
        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="all">All {label.toLowerCase()}</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
