"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipForward } from "lucide-react";
import { useRouter } from "next/navigation";
import { ExerciseSelector } from "@/components/exercise-selector";
import { ExerciseDemonstration } from "@/components/exercise-visuals";
import { Button, Card } from "@/components/ui";
import { getExerciseVisual } from "@/lib/exercise-catalog";
import { exercisePrescription, type Exercise } from "@/lib/exercises";

type Phase = "select" | "ready" | "set" | "rest" | "done";
const blank = (): Exercise => ({
  name: "",
  sets: 3,
  reps: 10,
  weightLb: null,
  restSeconds: 45,
  setDurationSeconds: null,
});

export function FreeFormWorkoutRunner() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("select");
  const [exercise, setExercise] = useState<Exercise>(blank());
  const [exerciseId, setExerciseId] = useState(crypto.randomUUID());
  const [setNumber, setSetNumber] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const [estimatedCalories, setEstimatedCalories] = useState<number | null>();
  const [message, setMessage] = useState<string>();
  const [saving, setSaving] = useState(false);
  const deadline = useRef(0);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/workouts/free-form").then(async (response) => {
      const body = await response.json().catch(() => ({}));
      if (cancelled) return;
      if (!response.ok)
        setMessage(body.error ?? "Could not load Free Form workout.");
      else if (body.session) {
        setSessionId(body.session.id);
        setEstimatedCalories(
          body.session.estimated_cal_burned === null
            ? null
            : Number(body.session.estimated_cal_burned),
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if ((phase !== "set" && phase !== "rest") || paused || seconds <= 0) return;
    deadline.current = Date.now() + seconds * 1000;
    const timer = window.setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((deadline.current - Date.now()) / 1000),
      );
      setSeconds(remaining);
      if (remaining === 0) {
        window.clearInterval(timer);
        if (phase === "set") void completeSet();
        else beginSet();
      }
    }, 250);
    return () => window.clearInterval(timer);
    // completeSet and beginSet deliberately use the current exercise/set state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paused]);

  function update(field: keyof Exercise, value: string) {
    setExercise((current) => ({
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

  function beginSet() {
    setSeconds(exercise.setDurationSeconds ?? 0);
    setPaused(false);
    setPhase("set");
  }

  function startExercise() {
    if (!exercise.name || exercise.sets < 1 || exercise.reps < 1) {
      setMessage("Select an exercise and enter valid sets and reps.");
      return;
    }
    setMessage(undefined);
    setSetNumber(1);
    beginSet();
  }

  async function completeSet() {
    if (saving) return;
    setSaving(true);
    const response = await fetch("/api/workouts/free-form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exercise: { ...exercise, id: exerciseId },
        completedSets: setNumber,
      }),
    });
    const body = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setMessage(body.error ?? "Could not save this completed set.");
      return;
    }
    setSessionId(body.id);
    setEstimatedCalories(body.estimatedCalBurned ?? null);
    if (setNumber >= exercise.sets) {
      setPhase("select");
      setExercise(blank());
      setExerciseId(crypto.randomUUID());
      setSetNumber(1);
      return;
    }
    setSetNumber((value) => value + 1);
    if (exercise.restSeconds === 0) {
      beginSet();
      return;
    }
    setSeconds(exercise.restSeconds);
    setPaused(false);
    setPhase("rest");
  }

  async function finish() {
    if (sessionId)
      await fetch(`/api/workouts/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
    setPhase("done");
  }

  if (phase === "done")
    return (
      <Card className="mx-auto mt-10 max-w-xl text-center">
        <p className="text-sm font-semibold text-emerald-600">
          FREE FORM COMPLETE
        </p>
        <h1 className="mt-2 text-3xl font-bold">Great work.</h1>
        <p className="mt-3 text-slate-500">
          Your exercises and completed sets are saved in workout history.
        </p>
        <Button className="mt-6" onClick={() => router.push("/exercises")}>
          Back to exercises
        </Button>
      </Card>
    );

  if (phase === "select")
    return (
      <div className="mx-auto mt-3 max-w-2xl">
        <Card>
          <p className="text-sm font-semibold text-emerald-600">FREE FORM</p>
          <h1 className="mt-1 text-3xl font-bold">Choose your next exercise</h1>
          <p className="mt-2 text-slate-500">
            Do the sets, then come back here to choose another exercise.
          </p>
          <ExerciseSelector
            label="Exercise"
            value={exercise.name}
            onChange={(value) => update("name", value)}
          />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field
              label="Sets"
              value={exercise.sets}
              min={1}
              onChange={(value) => update("sets", value)}
            />
            <Field
              label="Reps"
              value={exercise.reps}
              min={1}
              onChange={(value) => update("reps", value)}
            />
            <Field
              label="Weight (lb)"
              value={exercise.weightLb ?? ""}
              min={0}
              onChange={(value) => update("weightLb", value)}
            />
            <Field
              label="Rest (seconds)"
              value={exercise.restSeconds}
              min={0}
              onChange={(value) => update("restSeconds", value)}
            />
            <Field
              label="Set duration (optional)"
              value={exercise.setDurationSeconds ?? ""}
              min={1}
              onChange={(value) => update("setDurationSeconds", value)}
            />
          </div>
          {message ? (
            <p className="mt-4 text-sm text-red-600">{message}</p>
          ) : null}
          {estimatedCalories !== undefined ? (
            <p className="mt-4 text-sm font-semibold text-emerald-700">
              Estimated calories burned: {estimatedCalories ?? "—"} kcal
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              disabled={
                !exercise.name || exercise.sets < 1 || exercise.reps < 1
              }
              onClick={() => {
                setPhase("ready");
                setMessage(undefined);
              }}
            >
              Continue
            </Button>
            {sessionId ? (
              <button
                className="text-sm font-semibold text-slate-700"
                onClick={() => void finish()}
                type="button"
              >
                Finish workout
              </button>
            ) : null}
          </div>
        </Card>
      </div>
    );

  return (
    <div className="mx-auto mt-3 max-w-2xl">
      <Card>
        <p className="text-sm font-semibold text-emerald-600">FREE FORM</p>
        <h1 className="mt-1 text-3xl font-bold">{exercise.name}</h1>
        <p className="mt-2 text-slate-500">
          {exercisePrescription(exercise).replace(`${exercise.name} · `, "")}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <section className="flex aspect-[4/3] items-center justify-center rounded-xl border border-slate-200 p-4">
            {phase === "ready" ? (
              <Button
                aria-label="Start exercise"
                className="grid h-12 w-12 place-items-center p-0"
                onClick={startExercise}
              >
                <Play className="h-5 w-5 fill-current" />
              </Button>
            ) : (
              <div
                className={`w-full rounded-2xl p-5 text-center ${phase === "rest" ? "bg-slate-900 text-white" : "bg-emerald-50"}`}
              >
                <p className="font-semibold">
                  {phase === "rest"
                    ? "Rest"
                    : `Set ${setNumber}: ${exercise.reps} reps`}
                </p>
                {phase === "rest" || exercise.setDurationSeconds !== null ? (
                  <p className="mt-2 text-5xl font-bold tabular-nums">
                    {Math.floor(seconds / 60)}:
                    {String(seconds % 60).padStart(2, "0")}
                  </p>
                ) : null}
                <div className="mt-5 flex justify-center gap-3">
                  <button
                    aria-label={paused ? "Resume" : "Pause"}
                    className="grid h-12 w-12 place-items-center rounded-xl border border-emerald-600"
                    onClick={() => setPaused((value) => !value)}
                    type="button"
                  >
                    {paused ? (
                      <Play className="h-5 w-5" />
                    ) : (
                      <Pause className="h-5 w-5" />
                    )}
                  </button>
                  <Button
                    aria-label={phase === "rest" ? "Skip rest" : "Complete set"}
                    className="grid h-12 w-12 place-items-center p-0"
                    disabled={saving || paused}
                    onClick={() =>
                      phase === "rest" ? beginSet() : void completeSet()
                    }
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </section>
          <ExerciseDemonstration
            isAnimating={phase === "set" && !paused}
            name={exercise.name}
            visual={getExerciseVisual(exercise.name)}
          />
        </div>
        {message ? (
          <p className="mt-4 text-sm text-red-600">{message}</p>
        ) : null}
        <div className="mt-6 flex justify-end">
          <button
            className="text-sm font-semibold"
            onClick={() => {
              if (
                window.confirm(
                  "End this workout? Completed sets are already saved.",
                )
              )
                void finish();
            }}
            type="button"
          >
            End workout
          </button>
        </div>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number | string;
  min: number;
  onChange: (value: string) => void;
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
