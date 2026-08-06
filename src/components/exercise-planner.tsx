"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { HeartPulse, Pencil, Plus, Trash2, X } from "lucide-react";
import { ExerciseSelector } from "@/components/exercise-selector";
import { ExerciseMuscleMap } from "@/components/exercise-visuals";
import { Button, Card, EmptyState } from "@/components/ui";
import {
  demoFrames,
  getExerciseVisual,
  type BodyView,
  type ExerciseVisual,
  type MuscleId,
} from "@/lib/exercise-catalog";
import { formatInTimeZone } from "@/lib/timezone";
import { days, type Exercise, type ExercisePlan } from "@/lib/exercises";

const blankExercise = (): Exercise => ({
  name: "",
  sets: 3,
  reps: 10,
  weightLb: null,
  restSeconds: 45,
  setDurationSeconds: null,
});

type Session = {
  id: string;
  startedAt: string;
  estimatedCalBurned: number | null;
  exercises: Array<{
    name: string;
    plannedSets: number;
    completedSets: number;
  }>;
};

export function ExercisePlanner({
  initialPlans,
  sessions: initialSessions,
  initialActiveDay,
}: {
  initialPlans: ExercisePlan[];
  sessions: Session[];
  initialActiveDay: number;
}) {
  const [plans, setPlans] = useState(initialPlans);
  const [activeDay, setActiveDay] = useState(initialActiveDay);
  const [editingDay, setEditingDay] = useState<number>();
  const [draft, setDraft] = useState({
    isRestDay: false,
    exercises: [blankExercise()],
  });
  const [message, setMessage] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [markingDone, setMarkingDone] = useState(false);
  const [sessions, setSessions] = useState(initialSessions);
  const [deletingSession, setDeletingSession] = useState<string>();
  const [showMuscleMap, setShowMuscleMap] = useState(false);

  const activePlan = plans.find((plan) => plan.dayOfWeek === activeDay);
  const canWorkout = Boolean(
    activePlan && !activePlan.isRestDay && activePlan.exercises.length,
  );
  const muscleVisual = activePlan?.isRestDay
    ? undefined
    : buildAggregatedMuscleVisual(activePlan?.exercises ?? []);

  function open(day: number) {
    const plan = plans.find((item) => item.dayOfWeek === day);
    setActiveDay(day);
    setEditingDay(day);
    setShowMuscleMap(false);
    setDraft(
      plan
        ? {
            isRestDay: plan.isRestDay,
            exercises: plan.exercises.map((exercise) => ({ ...exercise })),
          }
        : { isRestDay: false, exercises: [blankExercise()] },
    );
    setMessage(undefined);
  }

  function updateExercise(index: number, field: keyof Exercise, value: string) {
    setDraft((current) => ({
      ...current,
      exercises: current.exercises.map((exercise, i) =>
        i === index
          ? {
              ...exercise,
              [field]:
                field === "name"
                  ? value
                  : value === ""
                    ? field === "weightLb" || field === "setDurationSeconds"
                      ? null
                      : 0
                    : Number(value),
            }
          : exercise,
      ),
    }));
  }

  async function save() {
    if (editingDay === undefined) return;
    setMessage(undefined);
    if (
      !draft.isRestDay &&
      draft.exercises.some(
        (exercise) =>
          !exercise.name.trim() || exercise.sets < 1 || exercise.reps < 1,
      )
    ) {
      setMessage("Select an exercise and enter sets and reps for every item.");
      return;
    }
    setSaving(true);
    const response = await fetch(`/api/exercises/${editingDay}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const body = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setMessage(body.error ?? "Could not save plan.");
      return;
    }
    setPlans((current) =>
      [...current.filter((plan) => plan.dayOfWeek !== editingDay), body].sort(
        (a, b) => a.dayOfWeek - b.dayOfWeek,
      ),
    );
    setEditingDay(undefined);
  }

  async function markDone() {
    if (!activePlan) return;
    setMessage(undefined);
    setMarkingDone(true);
    const startResponse = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: activePlan.id,
        status: "completed",
        completedSets: activePlan.exercises.map((exercise, exerciseIndex) => ({
          exerciseIndex,
          completedSets: exercise.sets,
        })),
      }),
    });
    const session = await startResponse.json().catch(() => ({}));
    if (!startResponse.ok) {
      setMarkingDone(false);
      setMessage(session.error ?? "Could not mark this workout as done.");
      return;
    }
    setMarkingDone(false);
    setMessage("Workout marked as done.");
  }

  async function removeSession(session: Session) {
    if (!window.confirm("Delete this workout session? This cannot be undone."))
      return;
    setMessage(undefined);
    setDeletingSession(session.id);
    try {
      const response = await fetch(`/api/workouts/${session.id}`, {
        method: "DELETE",
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(body.error ?? "Could not delete workout.");
        return;
      }
      setSessions((current) =>
        current.filter((item) => item.id !== session.id),
      );
    } catch {
      setMessage("Could not delete workout.");
    } finally {
      setDeletingSession(undefined);
    }
  }

  if (editingDay !== undefined) {
    return (
      <section className="mt-8">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                {days[editingDay].toUpperCase()}
              </p>
              <h2 className="mt-1 text-xl font-bold">Edit workout plan</h2>
            </div>
            <button
              aria-label="Close plan editor"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              onClick={() => setEditingDay(undefined)}
              title="Close"
              type="button"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
          <label className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-medium">
            <input
              checked={draft.isRestDay}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  isRestDay: event.target.checked,
                  exercises: event.target.checked
                    ? []
                    : current.exercises.length
                      ? current.exercises
                      : [blankExercise()],
                }))
              }
              type="checkbox"
            />
            REST day
          </label>
          {!draft.isRestDay ? (
            <div className="mt-5 space-y-4">
              {draft.exercises.map((exercise, index) => (
                <fieldset
                  className="rounded-xl border border-slate-200 p-3"
                  key={index}
                >
                  <div className="flex justify-between gap-3">
                    <legend className="font-semibold">
                      Exercise {index + 1}
                    </legend>
                    {draft.exercises.length > 1 ? (
                      <button
                        aria-label={`Remove exercise ${index + 1}`}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            exercises: current.exercises.filter(
                              (_, i) => i !== index,
                            ),
                          }))
                        }
                        title="Remove exercise"
                        type="button"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                  <ExerciseSelector
                    label={`Exercise ${index + 1}`}
                    value={exercise.name}
                    onChange={(value) => updateExercise(index, "name", value)}
                  />
                  {exercise.name ? (
                    <ExerciseMuscleMap
                      visual={getExerciseVisual(exercise.name)}
                    />
                  ) : null}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Field
                      label="Sets"
                      value={exercise.sets}
                      onChange={(value) => updateExercise(index, "sets", value)}
                      min="1"
                    />
                    <Field
                      label="Reps"
                      value={exercise.reps}
                      onChange={(value) => updateExercise(index, "reps", value)}
                      min="1"
                    />
                    <Field
                      label="Total weight (lb)"
                      value={exercise.weightLb ?? ""}
                      onChange={(value) =>
                        updateExercise(index, "weightLb", value)
                      }
                      min="0"
                    />
                    <Field
                      label="Rest (seconds)"
                      value={exercise.restSeconds}
                      onChange={(value) =>
                        updateExercise(index, "restSeconds", value)
                      }
                      min="0"
                    />
                    <Field
                      label="Set duration (seconds)"
                      value={exercise.setDurationSeconds ?? ""}
                      onChange={(value) =>
                        updateExercise(index, "setDurationSeconds", value)
                      }
                      min="1"
                    />
                  </div>
                </fieldset>
              ))}
              <button
                className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    exercises: [...current.exercises, blankExercise()],
                  }))
                }
                type="button"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                Add exercise
              </button>
            </div>
          ) : null}
          {message ? (
            <p aria-live="polite" className="mt-4 text-sm text-red-600">
              {message}
            </p>
          ) : null}
          <div className="mt-6 flex gap-3">
            <Button disabled={saving} onClick={save} type="button">
              {saving ? "Saving…" : "Save plan"}
            </Button>
            <button
              className="text-sm font-semibold text-slate-600"
              onClick={() => setEditingDay(undefined)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <Card className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-600">FREE FORM</p>
          <h2 className="mt-1 text-xl font-bold">Train without a plan</h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose an exercise, finish its sets, then choose the next one.
          </p>
        </div>
        <Link
          className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-700"
          href="/exercises/free-form"
        >
          Start Free Form
        </Link>
      </Card>
      <nav
        aria-label="Days of the week"
        className="grid w-full grid-cols-7 gap-1 sm:gap-2"
      >
        {days.map((day, index) => (
          <button
            aria-current={activeDay === index ? "date" : undefined}
            className={`min-w-0 rounded-xl px-1 py-3 text-xs font-semibold transition sm:px-4 sm:text-sm ${activeDay === index ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            key={day}
            onClick={() => {
              setActiveDay(index);
              setMessage(undefined);
              setShowMuscleMap(false);
            }}
            type="button"
          >
            <span className="block sm:hidden">{day.slice(0, 3)}</span>
            <span className="hidden sm:block">{day}</span>
          </button>
        ))}
      </nav>
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-600">
              {days[activeDay].toUpperCase()}
            </p>
            <h2 className="mt-1 text-xl font-bold">
              {activePlan?.isRestDay
                ? "Rest day"
                : activePlan
                  ? "Planned workout"
                  : "No workout planned"}
            </h2>
          </div>
          {muscleVisual ? (
            <button
              aria-label={
                showMuscleMap ? "Show exercise list" : "Show muscle map"
              }
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
              onClick={() => setShowMuscleMap((current) => !current)}
              title={showMuscleMap ? "Show exercise list" : "Show muscle map"}
              type="button"
            >
              <HeartPulse aria-hidden="true" className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        {activePlan && !activePlan.isRestDay ? (
          showMuscleMap && muscleVisual ? (
            <div className="mt-5">
              <ExerciseMuscleMap visual={muscleVisual} />
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {activePlan.exercises.map((exercise, index) => (
                <ExercisePreview
                  exercise={exercise}
                  key={`${exercise.name}-${index}`}
                />
              ))}
            </div>
          )
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            {activePlan?.isRestDay
              ? "Recovery is part of the plan."
              : "Add a workout for this day when you are ready."}
          </p>
        )}
        {message ? (
          <p
            aria-live="polite"
            className="mt-4 text-sm font-medium text-emerald-700"
          >
            {message}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          {canWorkout ? (
            <Link
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              href={`/exercises/${activeDay}`}
            >
              Start
            </Link>
          ) : (
            <Button disabled type="button">
              Start
            </Button>
          )}
          <Button
            disabled={!canWorkout || markingDone}
            onClick={markDone}
            type="button"
          >
            {markingDone ? "Marking…" : "Mark as done"}
          </Button>
          <button
            aria-label="Edit workout plan"
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
            onClick={() => open(activeDay)}
            title="Edit workout plan"
            type="button"
          >
            <Pencil aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </Card>
      <Card>
        <h2 className="font-semibold">Recent workouts</h2>
        {sessions.length ? (
          <div className="mt-3 divide-y divide-slate-100">
            {sessions.map((session) => (
              <div
                className="flex justify-between gap-3 py-3 text-sm"
                key={session.id}
              >
                <span>
                  {formatInTimeZone(session.startedAt, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <div className="flex items-center gap-3">
                  {session.estimatedCalBurned !== null ? (
                    <span className="font-semibold text-emerald-700">
                      {session.estimatedCalBurned} kcal
                    </span>
                  ) : null}
                  <div
                    aria-label="Exercise completion progress"
                    className="flex items-center gap-1"
                  >
                    {session.exercises.map((exercise, index) => {
                      const isComplete =
                        exercise.plannedSets > 0 &&
                        exercise.completedSets >= exercise.plannedSets;
                      const hasProgress = exercise.completedSets > 0;
                      return (
                        <span
                          aria-label={`${exercise.name}: ${exercise.completedSets} of ${exercise.plannedSets} sets completed`}
                          className={`size-3 rounded-full border border-slate-300 ${isComplete ? "bg-emerald-600" : hasProgress ? "bg-emerald-100" : "bg-white"}`}
                          key={`${exercise.name}-${index}`}
                          role="img"
                          title={`${exercise.name}: ${exercise.completedSets}/${exercise.plannedSets} sets`}
                        />
                      );
                    })}
                  </div>
                  <button
                    aria-label="Delete workout session"
                    className="grid h-8 w-8 place-items-center rounded-lg text-[0px] text-red-600 hover:bg-red-50 disabled:opacity-50"
                    disabled={deletingSession === session.id}
                    onClick={() => void removeSession(session)}
                    title="Delete workout session"
                    type="button"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                    {deletingSession === session.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No workouts yet"
            description="Completed workouts will appear here."
          />
        )}
      </Card>
    </div>
  );
}

function buildAggregatedMuscleVisual(
  exercises: Exercise[],
): ExerciseVisual | undefined {
  const visuals = exercises
    .map((exercise) => getExerciseVisual(exercise.name))
    .filter((visual): visual is ExerciseVisual => Boolean(visual));

  if (!visuals.length) return undefined;

  const primary = Array.from(
    new Set(visuals.flatMap((visual) => visual.primary)),
  ) as MuscleId[];
  const secondary = Array.from(
    new Set(visuals.flatMap((visual) => visual.secondary)),
  ) as MuscleId[];
  const views = Array.from(
    new Set(visuals.flatMap((visual) => visual.views)),
  ) as BodyView[];

  return {
    category: "Planned workout",
    primary,
    secondary,
    views: views.length ? views : ["front", "back"],
  };
}

function ExercisePreview({ exercise }: { exercise: Exercise }) {
  const visual = getExerciseVisual(exercise.name);
  const frame = visual?.demoId ? demoFrames(visual.demoId).start : undefined;

  return (
    <article className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      {frame ? (
        <Image
          alt={`${exercise.name} starting position`}
          className="aspect-[4/3] w-full bg-white object-contain"
          height={240}
          src={frame}
          width={320}
        />
      ) : (
        <div
          aria-label={`${exercise.name} image unavailable`}
          className="flex aspect-[4/3] items-center justify-center bg-emerald-50 text-xs font-medium text-emerald-700"
          role="img"
        >
          Exercise image unavailable
        </div>
      )}
      <p className="truncate px-3 py-2 text-center text-sm font-semibold text-slate-700">
        {exercise.name}
      </p>
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
  min,
}: {
  label: string;
  value: number | string;
  onChange: (value: string) => void;
  min: string;
}) {
  return (
    <label className="text-xs font-medium text-slate-600">
      {label}
      <input
        className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
        min={min}
        onChange={(event) => onChange(event.target.value)}
        type="number"
        value={value}
      />
    </label>
  );
}
