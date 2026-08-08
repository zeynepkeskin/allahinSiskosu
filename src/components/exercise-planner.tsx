"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type DragEvent } from "react";
import { GripVertical, HeartPulse, Plus, Trash2, X } from "lucide-react";
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
  const [message, setMessage] = useState<string>();
  const [sessions, setSessions] = useState(initialSessions);
  const [deletingSession, setDeletingSession] = useState<string>();
  const [showMuscleMap, setShowMuscleMap] = useState(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<
    number | null
  >();
  const [exerciseDraft, setExerciseDraft] = useState<Exercise>(blankExercise());
  const [dialogMessage, setDialogMessage] = useState<string>();
  const [savingExercise, setSavingExercise] = useState(false);
  const [draggingExerciseIndex, setDraggingExerciseIndex] = useState<number>();
  const [dragOverExerciseIndex, setDragOverExerciseIndex] = useState<number>();
  const [reorderingExercises, setReorderingExercises] = useState(false);
  const exerciseWasDragged = useRef(false);

  const activePlan = plans.find((plan) => plan.dayOfWeek === activeDay);
  const activeExercises = activePlan?.exercises ?? [];
  const canWorkout = activeExercises.length > 0;
  const workoutDuration = formatWorkoutDuration(activeExercises);
  const muscleVisual = buildAggregatedMuscleVisual(activeExercises);
  const dialogOpen = editingExerciseIndex !== undefined;
  const isEditingExercise = editingExerciseIndex !== null;

  function updateExerciseDraft(field: keyof Exercise, value: string) {
    setExerciseDraft((current) => ({
      ...current,
      [field]:
        field === "name"
          ? value
          : value === ""
            ? field === "weightLb" || field === "setDurationSeconds"
              ? null
              : 0
            : Number(value),
    }));
  }

  function openAddExercise() {
    setExerciseDraft(blankExercise());
    setDialogMessage(undefined);
    setEditingExerciseIndex(null);
  }

  function openEditExercise(exercise: Exercise, index: number) {
    setExerciseDraft({ ...exercise });
    setDialogMessage(undefined);
    setEditingExerciseIndex(index);
  }

  function closeExerciseDialog() {
    if (!savingExercise) setEditingExerciseIndex(undefined);
  }

  async function persistExercises(exercises: Exercise[]) {
    const response = await fetch(`/api/exercises/${activeDay}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exercises }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error ?? "Could not save exercise.");
    setPlans((current) =>
      [...current.filter((plan) => plan.dayOfWeek !== activeDay), body].sort(
        (a, b) => a.dayOfWeek - b.dayOfWeek,
      ),
    );
  }

  async function saveExercise() {
    if (
      !exerciseDraft.name.trim() ||
      exerciseDraft.sets < 1 ||
      exerciseDraft.reps < 1
    ) {
      setDialogMessage("Select an exercise and enter sets and reps.");
      return;
    }

    const exercises = isEditingExercise
      ? activeExercises.map((exercise, index) =>
          index === editingExerciseIndex ? exerciseDraft : exercise,
        )
      : [...activeExercises, exerciseDraft];

    setSavingExercise(true);
    setDialogMessage(undefined);
    try {
      await persistExercises(exercises);
      setEditingExerciseIndex(undefined);
      setMessage(
        isEditingExercise
          ? `${exerciseDraft.name} updated.`
          : `${exerciseDraft.name} added to ${days[activeDay]}.`,
      );
    } catch (error) {
      setDialogMessage(
        error instanceof Error ? error.message : "Could not save exercise.",
      );
    } finally {
      setSavingExercise(false);
    }
  }

  async function deleteExercise() {
    if (!isEditingExercise || editingExerciseIndex === undefined) return;
    if (!window.confirm(`Delete ${exerciseDraft.name} from this workout?`))
      return;

    const exercises = activeExercises.filter(
      (_, index) => index !== editingExerciseIndex,
    );
    setSavingExercise(true);
    setDialogMessage(undefined);
    try {
      if (exercises.length) {
        await persistExercises(exercises);
      } else {
        const response = await fetch(`/api/exercises/${activeDay}`, {
          method: "DELETE",
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(body.error ?? "Could not delete exercise.");
        setPlans((current) =>
          current.filter((plan) => plan.dayOfWeek !== activeDay),
        );
      }
      setEditingExerciseIndex(undefined);
      setMessage(`${exerciseDraft.name} deleted.`);
    } catch (error) {
      setDialogMessage(
        error instanceof Error ? error.message : "Could not delete exercise.",
      );
    } finally {
      setSavingExercise(false);
    }
  }

  async function reorderExercises(
    event: DragEvent<HTMLButtonElement>,
    targetIndex: number,
  ) {
    event.preventDefault();
    const sourceIndex = draggingExerciseIndex;
    setDraggingExerciseIndex(undefined);
    setDragOverExerciseIndex(undefined);
    if (sourceIndex === undefined || sourceIndex === targetIndex) return;

    const reordered = [...activeExercises];
    const [movedExercise] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, movedExercise);
    const previousPlans = plans;

    setPlans((current) =>
      current.map((plan) =>
        plan.dayOfWeek === activeDay ? { ...plan, exercises: reordered } : plan,
      ),
    );
    setReorderingExercises(true);
    setMessage(undefined);
    try {
      await persistExercises(reordered);
      setMessage("Exercise order updated.");
    } catch (error) {
      setPlans(previousPlans);
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not update exercise order.",
      );
    } finally {
      setReorderingExercises(false);
    }
  }

  function finishExerciseDrag() {
    setDraggingExerciseIndex(undefined);
    setDragOverExerciseIndex(undefined);
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

  return (
    <div className="mt-8 space-y-6">
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
              {canWorkout ? "Planned workout" : "No workout planned"}
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
        {showMuscleMap && muscleVisual ? (
          <div className="mt-5">
            <ExerciseMuscleMap visual={muscleVisual} />
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {activeExercises.map((exercise, index) => (
              <ExercisePreview
                disabled={reorderingExercises}
                dragging={draggingExerciseIndex === index}
                dragOver={dragOverExerciseIndex === index}
                exercise={exercise}
                key={exercise.id ?? `${exercise.name}-${index}`}
                onClick={() => {
                  if (exerciseWasDragged.current) {
                    exerciseWasDragged.current = false;
                    return;
                  }
                  openEditExercise(exercise, index);
                }}
                onDragEnd={finishExerciseDrag}
                onDragEnter={() => {
                  if (draggingExerciseIndex !== undefined)
                    setDragOverExerciseIndex(index);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={(event) => {
                  exerciseWasDragged.current = true;
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", String(index));
                  setDraggingExerciseIndex(index);
                  setDragOverExerciseIndex(index);
                }}
                onDrop={(event) => void reorderExercises(event, index)}
              />
            ))}
            <AddExerciseCard onClick={openAddExercise} />
          </div>
        )}
        {message ? (
          <p
            aria-live="polite"
            className="mt-4 text-sm font-medium text-emerald-700"
          >
            {message}
          </p>
        ) : null}
        {canWorkout ? (
          <div className="mt-6 flex items-center gap-3">
            <Link
              className="inline-block rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              href={`/exercises/${activeDay}`}
            >
              Start
            </Link>
            <span className="text-sm font-medium text-slate-500">
              {workoutDuration}
            </span>
          </div>
        ) : null}
      </Card>
      {dialogOpen ? (
        <ExerciseDialog
          draft={exerciseDraft}
          isEditing={isEditingExercise}
          message={dialogMessage}
          saving={savingExercise}
          onChange={updateExerciseDraft}
          onClose={closeExerciseDialog}
          onDelete={() => void deleteExercise()}
          onSave={() => void saveExercise()}
        />
      ) : null}
      <Card className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-600">
            OR: FREE FORM
          </p>
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

function AddExerciseCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      aria-haspopup="dialog"
      className="group min-w-0 overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white text-slate-600 transition hover:border-emerald-500 hover:text-emerald-700"
      onClick={onClick}
      type="button"
    >
      <span className="flex aspect-[4/3] w-full items-center justify-center bg-white">
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-current transition group-hover:scale-105">
          <Plus aria-hidden="true" className="h-6 w-6" />
        </span>
      </span>
      <span className="block bg-slate-50 px-3 py-2 text-center text-sm font-semibold">
        Add Exercise
      </span>
    </button>
  );
}

function ExerciseDialog({
  draft,
  isEditing,
  message,
  saving,
  onChange,
  onClose,
  onDelete,
  onSave,
}: {
  draft: Exercise;
  isEditing: boolean;
  message?: string;
  saving: boolean;
  onChange: (field: keyof Exercise, value: string) => void;
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
}) {
  return (
    <div
      aria-labelledby="exercise-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-end bg-slate-950/45 p-3 sm:items-center sm:justify-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
      role="dialog"
    >
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              BUILD YOUR WORKOUT
            </p>
            <h2 className="mt-1 text-xl font-bold" id="exercise-dialog-title">
              {isEditing ? "Edit exercise" : "Add exercise"}
            </h2>
          </div>
          <button
            aria-label="Close exercise form"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>
        <div className="p-5">
          <ExerciseSelector
            label="Exercise"
            onChange={(value) => onChange("name", value)}
            value={draft.name}
          />
          <ExerciseMuscleMap visual={getExerciseVisual(draft.name)} />
          <div className="mt-4 grid grid-cols-2 gap-3 min-[520px]:grid-cols-5">
            <Field
              label="Sets"
              min="1"
              onChange={(value) => onChange("sets", value)}
              value={draft.sets}
            />
            <Field
              label="Reps"
              min="1"
              onChange={(value) => onChange("reps", value)}
              value={draft.reps}
            />
            <Field
              label="Weight (lb)"
              min="0"
              onChange={(value) => onChange("weightLb", value)}
              value={draft.weightLb ?? ""}
            />
            <Field
              label="Rest (s)"
              min="0"
              onChange={(value) => onChange("restSeconds", value)}
              value={draft.restSeconds}
            />
            <Field
              label="Duration (s)"
              min="1"
              onChange={(value) => onChange("setDurationSeconds", value)}
              value={draft.setDurationSeconds ?? ""}
            />
          </div>
          {message ? (
            <p aria-live="polite" className="mt-4 text-sm text-red-600">
              {message}
            </p>
          ) : null}
        </div>
        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
          <div>
            {isEditing ? (
              <button
                className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                disabled={saving}
                onClick={onDelete}
                type="button"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Delete
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <button
              className="text-sm font-semibold text-slate-600"
              disabled={saving}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <Button disabled={saving} onClick={onSave} type="button">
              {saving ? "Saving…" : isEditing ? "Save changes" : "Add exercise"}
            </Button>
          </div>
        </footer>
      </section>
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
  return {
    category: "Planned workout",
    primary: Array.from(
      new Set(visuals.flatMap((visual) => visual.primary)),
    ) as MuscleId[],
    secondary: Array.from(
      new Set(visuals.flatMap((visual) => visual.secondary)),
    ) as MuscleId[],
    views: Array.from(
      new Set(visuals.flatMap((visual) => visual.views)),
    ) as BodyView[],
  };
}

function formatWorkoutDuration(exercises: Exercise[]) {
  const totalSeconds = exercises.reduce((total, exercise, index) => {
    const setSeconds =
      exercise.setDurationSeconds ??
      Math.min(90, Math.max(20, exercise.reps * 3));
    const rests = exercise.sets - (index === exercises.length - 1 ? 1 : 0);
    return (
      total +
      exercise.sets * setSeconds +
      Math.max(0, rests) * exercise.restSeconds
    );
  }, 0);
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  return `About ${minutes} min`;
}

function exerciseCardName(name: string) {
  const shortened = name
    .replace(/\b(?:barbell|dumbbells?|dumbells?)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return shortened || name;
}
function ExercisePreview({
  disabled,
  dragging,
  dragOver,
  exercise,
  onClick,
  onDragEnd,
  onDragEnter,
  onDragOver,
  onDragStart,
  onDrop,
}: {
  disabled: boolean;
  dragging: boolean;
  dragOver: boolean;
  exercise: Exercise;
  onClick: () => void;
  onDragEnd: () => void;
  onDragEnter: () => void;
  onDragOver: (event: DragEvent<HTMLButtonElement>) => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
  onDrop: (event: DragEvent<HTMLButtonElement>) => void;
}) {
  const visual = getExerciseVisual(exercise.name);
  const frame = visual?.demoId ? demoFrames(visual.demoId).start : undefined;
  return (
    <button
      aria-label={`Edit ${exercise.name}. Drag to reorder.`}
      className={`min-w-0 overflow-hidden rounded-xl border bg-slate-50 text-left transition hover:border-emerald-400 hover:shadow-sm ${dragOver && !dragging ? "border-emerald-500 ring-2 ring-emerald-200" : "border-slate-200"} ${dragging ? "opacity-40" : ""}`}
      disabled={disabled}
      draggable={!disabled}
      onClick={onClick}
      onDragEnd={onDragEnd}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragStart={onDragStart}
      onDrop={onDrop}
      title="Drag to reorder or click to edit"
      type="button"
    >
      {frame ? (
        <Image
          alt={`${exercise.name} starting position`}
          className="aspect-[4/3] w-full bg-white p-3 object-contain"
          height={240}
          src={frame}
          width={320}
        />
      ) : (
        <span
          aria-label={`${exercise.name} image unavailable`}
          className="flex aspect-[4/3] items-center justify-center bg-emerald-50 text-xs font-medium text-emerald-700"
          role="img"
        >
          Exercise image unavailable
        </span>
      )}
      <span className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-700">
        <GripVertical
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-slate-400"
        />
        <span className="truncate">{exerciseCardName(exercise.name)}</span>
      </span>
    </button>
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
    <label className="min-w-0 text-[11px] font-medium text-slate-600">
      {label}
      <input
        className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2 text-sm"
        inputMode="numeric"
        min={min}
        onChange={(event) => onChange(event.target.value)}
        type="number"
        value={value}
      />
    </label>
  );
}
