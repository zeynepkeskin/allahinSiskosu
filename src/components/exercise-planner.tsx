"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ExerciseSelector } from "@/components/exercise-selector";
import { ExerciseMuscleMap } from "@/components/exercise-visuals";
import { Button, Card, EmptyState } from "@/components/ui";
import { demoFrames, getExerciseVisual } from "@/lib/exercise-catalog";
import { formatInTimeZone } from "@/lib/timezone";
import {
  days,
  type Exercise,
  type ExercisePlan,
} from "@/lib/exercises";

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
  status: "completed" | "ended_early" | "in_progress";
  startedAt: string;
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

  const activePlan = plans.find((plan) => plan.dayOfWeek === activeDay);
  const canWorkout = Boolean(
    activePlan && !activePlan.isRestDay && activePlan.exercises.length,
  );

  function open(day: number) {
    const plan = plans.find((item) => item.dayOfWeek === day);
    setActiveDay(day);
    setEditingDay(day);
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
      body: JSON.stringify({ planId: activePlan.id }),
    });
    const session = await startResponse.json().catch(() => ({}));
    if (!startResponse.ok) {
      setMarkingDone(false);
      setMessage(session.error ?? "Could not mark this workout as done.");
      return;
    }
    const finishResponse = await fetch(`/api/workouts/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "completed",
        completedSets: activePlan.exercises.map((exercise, index) => ({
          id: session.exerciseIds[index],
          completedSets: exercise.sets,
        })),
      }),
    });
    const result = await finishResponse.json().catch(() => ({}));
    setMarkingDone(false);
    if (!finishResponse.ok) {
      setMessage(
        result.error ?? "The workout was started but could not be completed.",
      );
      return;
    }
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
              className="text-sm font-semibold text-slate-500"
              onClick={() => setEditingDay(undefined)}
              type="button"
            >
              Close
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
                        className="text-sm font-semibold text-red-600"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            exercises: current.exercises.filter(
                              (_, i) => i !== index,
                            ),
                          }))
                        }
                        type="button"
                      >
                        Remove
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
                className="text-sm font-semibold text-emerald-700"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    exercises: [...current.exercises, blankExercise()],
                  }))
                }
                type="button"
              >
                + Add exercise
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
      <nav
        aria-label="Days of the week"
        className="flex gap-2 overflow-x-auto pb-1"
      >
        {days.map((day, index) => (
          <button
            aria-current={activeDay === index ? "date" : undefined}
            className={`min-w-20 rounded-xl px-4 py-3 text-sm font-semibold transition ${activeDay === index ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            key={day}
            onClick={() => {
              setActiveDay(index);
              setMessage(undefined);
            }}
            type="button"
          >
            <span className="block sm:hidden">{day.slice(0, 3)}</span>
            <span className="hidden sm:block">{day}</span>
          </button>
        ))}
      </nav>
      <Card>
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
        {activePlan && !activePlan.isRestDay ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {activePlan.exercises.map((exercise, index) => (
              <ExercisePreview
                exercise={exercise}
                key={`${exercise.name}-${index}`}
              />
            ))}
          </div>
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
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => open(activeDay)}
            type="button"
          >
            Edit
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
                  <span
                    className={
                      session.status === "completed"
                        ? "font-semibold text-emerald-700"
                        : "font-semibold text-slate-500"
                    }
                  >
                    {session.status === "completed"
                      ? "Completed"
                      : session.status === "ended_early"
                        ? "Ended early"
                        : "In progress"}
                  </span>
                  <button
                    className="text-xs font-semibold text-red-600 disabled:opacity-50"
                    disabled={deletingSession === session.id}
                    onClick={() => void removeSession(session)}
                    type="button"
                  >
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
