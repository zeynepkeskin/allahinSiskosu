"use client";

import { useEffect, useRef, useState } from "react";
import {
  Music,
  Pause,
  Pencil,
  Play,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ExerciseDemonstration } from "@/components/exercise-visuals";
import { Button, Card, ProgressBar } from "@/components/ui";
import { getExerciseVisual } from "@/lib/exercise-catalog";
import { exercisePrescription, type ExercisePlan } from "@/lib/exercises";

type Phase = "ready" | "cue" | "set" | "rest" | "complete" | "ended";
type AudioContextConstructor = typeof AudioContext;
type EditableTimer = "set" | "rest";

const ordinal = (number: number) =>
  number === 1
    ? "First"
    : number === 2
      ? "Second"
      : number === 3
        ? "Third"
        : `${number}th`;

const soundtrackCount = 6;

function TimerEditButton({
  label,
  onClick,
  dark = false,
}: {
  label: string;
  onClick: () => void;
  dark?: boolean;
}) {
  return (
    <button
      aria-label={label}
      className={`rounded-lg p-2 transition hover:bg-black/10 ${dark ? "text-white hover:bg-white/15" : "text-slate-600"}`}
      onClick={onClick}
      title={label}
      type="button"
    >
      <Pencil aria-hidden="true" className="size-5" strokeWidth={2} />
    </button>
  );
}

function TimerEditor({
  label,
  value,
  onChange,
  onSave,
  onCancel,
  dark = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  dark?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor="workout-timer-seconds">
        {label}
      </label>
      <input
        autoFocus
        className={`w-24 rounded-lg border px-3 py-2 text-center text-xl font-bold tabular-nums ${dark ? "border-white/40 bg-white/10 text-white" : "border-slate-300 bg-white text-slate-900"}`}
        id="workout-timer-seconds"
        inputMode="numeric"
        min="0"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onSave();
          if (event.key === "Escape") onCancel();
        }}
        type="number"
        value={value}
      />
      <span className={`text-sm ${dark ? "text-slate-300" : "text-slate-500"}`}>
        sec
      </span>
      <button
        className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
        onClick={onSave}
        type="button"
      >
        Save
      </button>
      <button
        className={`px-2 py-2 text-sm font-semibold ${dark ? "text-white" : "text-slate-600"}`}
        onClick={onCancel}
        type="button"
      >
        Cancel
      </button>
    </div>
  );
}

export function WorkoutRunner({ plan }: { plan: ExercisePlan }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("ready"),
    [exerciseIndex, setExerciseIndex] = useState(0),
    [setNumber, setSetNumber] = useState(1),
    [seconds, setSeconds] = useState(0),
    [paused, setPaused] = useState(false),
    [muted, setMuted] = useState(false),
    [musicEnabled, setMusicEnabled] = useState(true),
    [isMusicPlaying, setIsMusicPlaying] = useState(false),
    [editingTimer, setEditingTimer] = useState<EditableTimer>(),
    [timerValue, setTimerValue] = useState(""),
    [timingOverrides, setTimingOverrides] = useState<
      Record<
        string,
        Pick<
          ExercisePlan["exercises"][number],
          "restSeconds" | "setDurationSeconds"
        >
      >
    >({}),
    [sessionId, setSessionId] = useState<string>(),
    [sessionExerciseIds, setSessionExerciseIds] = useState<string[]>([]),
    [message, setMessage] = useState<string>();
  const deadline = useRef<number | undefined>(undefined);
  const audioContext = useRef<AudioContext | undefined>(undefined);
  const music = useRef<HTMLAudioElement | undefined>(undefined);
  const musicStarted = useRef(false);
  const activeSources = useRef<OscillatorNode[]>([]);
  const cueTimers = useRef<Set<number>>(new Set());
  const cueVersion = useRef(0);
  const speechDone = useRef<(() => void) | undefined>(undefined);
  const restCuedSeconds = useRef<Set<number>>(new Set());
  const advancingRest = useRef(false);
  const completingSet = useRef(false);
  function exerciseAt(index: number) {
    const exercise = plan.exercises[index];
    const override = exercise.id ? timingOverrides[exercise.id] : undefined;
    return override ? { ...exercise, ...override } : exercise;
  }
  const current = exerciseAt(exerciseIndex);

  function ensureAudioContext() {
    if (muted || !("AudioContext" in window || "webkitAudioContext" in window))
      return;
    if (!audioContext.current) {
      const Context = (window.AudioContext ||
        (window as unknown as { webkitAudioContext: AudioContextConstructor })
          .webkitAudioContext) as AudioContextConstructor;
      audioContext.current = new Context();
    }
    if (audioContext.current.state === "suspended")
      void audioContext.current.resume();
  }

  function stopCues() {
    cueVersion.current += 1;
    cueTimers.current.forEach((timer) => window.clearTimeout(timer));
    cueTimers.current.clear();
    activeSources.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // A source may already have ended.
      }
    });
    activeSources.current = [];
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    speechDone.current?.();
    speechDone.current = undefined;
  }

  function stopMusic() {
    if (!music.current) return;
    music.current.pause();
    music.current.currentTime = 0;
    musicStarted.current = false;
    setIsMusicPlaying(false);
  }

  function pauseMusic() {
    music.current?.pause();
    setIsMusicPlaying(false);
  }

  async function playMusic(enabled = musicEnabled) {
    if (!enabled || !music.current) return;
    try {
      await music.current.play();
      setIsMusicPlaying(true);
    } catch {
      setMessage(
        "Music could not start. Use the Music on button to try again.",
      );
    }
  }

  function wait(milliseconds: number, version: number) {
    return new Promise<boolean>((resolve) => {
      const timer = window.setTimeout(() => {
        cueTimers.current.delete(timer);
        resolve(cueVersion.current === version);
      }, milliseconds);
      cueTimers.current.add(timer);
    });
  }

  function speak(text: string, version = cueVersion.current) {
    stopMusic();
    if (muted || !("speechSynthesis" in window))
      return Promise.resolve(cueVersion.current === version);
    return new Promise<boolean>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const done = () => {
        if (speechDone.current === done) speechDone.current = undefined;
        resolve(cueVersion.current === version);
      };
      speechDone.current = done;
      utterance.onend = done;
      utterance.onerror = done;
      window.speechSynthesis.speak(utterance);
    });
  }

  function beep(long = false) {
    stopMusic();
    if (muted) return;
    ensureAudioContext();
    const context = audioContext.current;
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const duration = long ? 1 : 0.12;
    oscillator.frequency.value = long ? 740 : 520;
    gain.gain.setValueAtTime(0.08, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      context.currentTime + duration,
    );
    oscillator.connect(gain).connect(context.destination);
    oscillator.onended = () => {
      activeSources.current = activeSources.current.filter(
        (source) => source !== oscillator,
      );
    };
    activeSources.current.push(oscillator);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  async function startSet(
    number: number,
    exercise = current,
    introduceExercise = false,
  ) {
    stopCues();
    completingSet.current = false;
    const version = cueVersion.current;
    setPhase("cue");
    setPaused(false);
    setSetNumber(number);
    const intro = introduceExercise
      ? `${exercise.name}. ${exercise.weightLb === null ? "Bodyweight" : `${exercise.weightLb} pounds`}. ${exercise.sets} sets with ${exercise.reps} reps. `
      : "";
    if (!(await speak(`${intro}${ordinal(number)} set.`, version))) return;
    for (let count = 0; count < 3; count += 1) {
      beep();
      if (!(await wait(1000, version))) return;
    }
    beep(true);
    if (!(await wait(1000, version))) return;
    if (!musicStarted.current) {
      musicStarted.current = true;
      await playMusic();
    }
    if (exercise.setDurationSeconds !== null)
      setSeconds(exercise.setDurationSeconds);
    if (cueVersion.current === version) setPhase("set");
  }

  async function begin() {
    setMessage(undefined);
    ensureAudioContext();
    music.current = new Audio(
      `/soundtracks/${Math.floor(Math.random() * soundtrackCount)}.mp3`,
    );
    music.current.loop = true;
    music.current.preload = "auto";
    const response = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: plan.id }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(body.error ?? "Could not start workout.");
      return;
    }
    setSessionId(body.id);
    setSessionExerciseIds(body.exerciseIds);
    void startSet(1, current, true);
  }

  function advanceFromRest() {
    if (advancingRest.current) return;
    advancingRest.current = true;
    if (setNumber < current.sets) {
      void startSet(setNumber + 1);
    } else if (exerciseIndex + 1 < plan.exercises.length) {
      const nextIndex = exerciseIndex + 1;
      const next = exerciseAt(nextIndex);
      setExerciseIndex(nextIndex);
      void startSet(1, next, true);
    } else {
      void finish("completed");
    }
  }

  useEffect(() => {
    if (phase !== "rest" || paused || editingTimer) return;
    deadline.current = Date.now() + seconds * 1000;
    restCuedSeconds.current.clear();
    advancingRest.current = false;
    const timer = window.setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((deadline.current! - Date.now()) / 1000),
      );
      setSeconds(remaining);
      if (
        remaining > 0 &&
        remaining <= 3 &&
        !restCuedSeconds.current.has(remaining)
      ) {
        restCuedSeconds.current.add(remaining);
        beep();
      }
      if (remaining === 0) {
        window.clearInterval(timer);
        advanceFromRest();
      }
    }, 250);
    return () => window.clearInterval(timer); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paused, editingTimer]);

  useEffect(() => {
    if (
      phase !== "set" ||
      current.setDurationSeconds === null ||
      paused ||
      editingTimer
    )
      return;
    deadline.current = Date.now() + seconds * 1000;
    const timer = window.setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((deadline.current! - Date.now()) / 1000),
      );
      setSeconds(remaining);
      if (remaining === 0) {
        window.clearInterval(timer);
        void completeSet();
      }
    }, 250);
    return () => window.clearInterval(timer); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, exerciseIndex, setNumber, paused, editingTimer]);

  useEffect(
    () => () => {
      stopCues();
      stopMusic();
    },
    [],
  );

  async function completeSet() {
    if (completingSet.current) return;
    completingSet.current = true;
    stopMusic();
    const completed = setNumber;
    const id = sessionExerciseIds[exerciseIndex];
    if (sessionId && id)
      await fetch(`/api/workouts/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedSets: [{ id, completedSets: completed }],
        }),
      });
    if (
      completed >= current.sets &&
      exerciseIndex + 1 >= plan.exercises.length
    ) {
      await finish("completed");
      return;
    }
    stopCues();
    await speak(`Completed. Now rest for ${current.restSeconds} seconds.`);
    setSeconds(current.restSeconds);
    setPhase("rest");
    setPaused(false);
  }

  async function finish(status: "completed" | "ended_early") {
    stopCues();
    stopMusic();
    if (sessionId)
      await fetch(`/api/workouts/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    setPhase(status === "completed" ? "complete" : "ended");
    void speak(
      status === "completed"
        ? "Workout complete. Great work."
        : "Workout ended.",
    );
  }

  function togglePause() {
    if (paused) {
      deadline.current = Date.now() + seconds * 1000;
      setPaused(false);
      if (phase === "set" && musicStarted.current) void playMusic();
    } else {
      pauseMusic();
      setPaused(true);
    }
  }

  function beginTimerEdit(timer: EditableTimer) {
    setTimerValue(String(seconds));
    setEditingTimer(timer);
  }

  async function saveTimerEdit() {
    const value = Number(timerValue);
    const maximum = editingTimer === "set" ? 7200 : 1800;
    const minimum = editingTimer === "set" ? 1 : 0;
    if (!Number.isInteger(value) || value < minimum || value > maximum) {
      setMessage(
        `Enter a whole number between ${minimum} and ${maximum} seconds.`,
      );
      return;
    }
    if (!editingTimer || !current.id) {
      setMessage("Could not identify this plan exercise.");
      return;
    }
    const response = await fetch(`/api/exercises/${plan.dayOfWeek}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: plan.id,
        exerciseId: current.id,
        timer: editingTimer,
        seconds: value,
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(body.error ?? "Could not update the exercise plan.");
      return;
    }
    setTimingOverrides((overrides) => ({
      ...overrides,
      [current.id!]: {
        restSeconds: editingTimer === "rest" ? value : current.restSeconds,
        setDurationSeconds:
          editingTimer === "set" ? value : current.setDurationSeconds,
      },
    }));
    setSeconds(value);
    deadline.current = Date.now() + value * 1000;
    setEditingTimer(undefined);
    setMessage(undefined);
  }

  function cancelTimerEdit() {
    setEditingTimer(undefined);
    setTimerValue("");
  }

  const totalSets = plan.exercises.reduce(
    (sum, exercise) => sum + exercise.sets,
    0,
  );
  const doneSets =
    plan.exercises
      .slice(0, exerciseIndex)
      .reduce((sum, exercise) => sum + exercise.sets, 0) +
    (phase === "rest" ? setNumber : Math.max(0, setNumber - 1));
  if (phase === "complete" || phase === "ended")
    return (
      <Card className="mx-auto mt-10 max-w-xl text-center">
        <p className="text-sm font-semibold text-emerald-600">
          {phase === "complete" ? "WORKOUT COMPLETE" : "WORKOUT ENDED"}
        </p>
        <h1 className="mt-2 text-3xl font-bold">
          {phase === "complete" ? "Great work." : "Saved your progress."}
        </h1>
        <p className="mt-3 text-slate-500">
          Your session has been saved to your workout history.
        </p>
        <Button className="mt-6" onClick={() => router.push("/exercises")}>
          Back to exercises
        </Button>
      </Card>
    );
  return (
    <div className="mx-auto mt-3 max-w-2xl">
      <button
        className="text-sm font-semibold text-slate-500"
        onClick={() => router.push("/exercises")}
        type="button"
      >
        ← Back to plan
      </button>
      <Card className="mt-5">
        <div className="flex justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-600">
              {phase === "ready"
                ? "READY"
                : phase === "rest"
                  ? "REST"
                  : phase === "cue"
                    ? "GET READY"
                    : "ACTIVE SET"}
            </p>
            <h1 className="mt-1 text-3xl font-bold">{current.name}</h1>
            <p className="mt-2 text-slate-500">
              {exercisePrescription(current).replace(`${current.name} · `, "")}
            </p>
          </div>
          <div className="flex items-start gap-1 text-slate-700">
            <button
              aria-pressed={muted}
              aria-label={muted ? "Turn sound on" : "Turn sound off"}
              className="grid size-8 place-items-center rounded-md transition hover:bg-slate-100"
              onClick={() => {
                if (!muted) {
                  stopCues();
                  if (phase === "cue") setPhase("set");
                }
                setMuted((value) => !value);
              }}
              title={muted ? "Sound off" : "Sound on"}
              type="button"
            >
              {muted ? (
                <VolumeX aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Volume2 aria-hidden="true" className="h-5 w-5" />
              )}
            </button>
            <button
              aria-pressed={musicEnabled}
              aria-label={musicEnabled ? "Turn music off" : "Turn music on"}
              className="grid size-8 place-items-center rounded-md transition hover:bg-slate-100"
              onClick={() => {
                const nextEnabled = !musicEnabled;
                setMusicEnabled(nextEnabled);
                if (nextEnabled && musicStarted.current)
                  void playMusic(nextEnabled);
                else if (!nextEnabled) pauseMusic();
              }}
              title={musicEnabled ? "Music on" : "Music off"}
              type="button"
            >
              <Music
                aria-hidden="true"
                className={`h-5 w-5 ${musicEnabled ? "" : "opacity-40"}`}
              />
            </button>
          </div>
        </div>
        <div className="mt-8">
          <ProgressBar
            label={`Set ${setNumber} of ${current.sets} · Exercise ${exerciseIndex + 1} of ${plan.exercises.length}`}
            value={(doneSets / totalSets) * 100}
          />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <section
            aria-label="Workout controls"
            className="flex aspect-[4/3] flex-col justify-center rounded-xl border border-slate-200 bg-white p-4"
          >
            {phase === "ready" ? (
              <div className="flex h-full items-center justify-center">
                <Button
                  aria-label="Start workout"
                  className="grid h-12 w-12 place-items-center p-0 text-[0px]"
                  onClick={begin}
                  title="Start workout"
                >
                  <Play aria-hidden="true" className="h-5 w-5 fill-current" />▶
                </Button>
              </div>
            ) : phase === "cue" ? (
              <div
                aria-live="polite"
                className="rounded-2xl bg-emerald-50 p-4 text-center"
              >
                <p className="text-lg font-semibold">
                  Get ready for set {setNumber}
                </p>
                <p className="mt-2 text-sm text-slate-600">3 • 2 • 1 • go</p>
              </div>
            ) : phase === "set" ? (
              <div className="rounded-2xl bg-emerald-50 p-4 text-center">
                <p className="text-lg font-semibold">
                  Set {setNumber}: {current.reps} reps
                </p>
                {current.setDurationSeconds !== null ? (
                  <div className="mt-2 flex items-center justify-center gap-2">
                    {editingTimer === "set" ? (
                      <TimerEditor
                        label="Set duration in seconds"
                        onCancel={cancelTimerEdit}
                        onChange={setTimerValue}
                        onSave={() => void saveTimerEdit()}
                        value={timerValue}
                      />
                    ) : (
                      <>
                        <p className="text-4xl font-bold tabular-nums text-slate-900">
                          {Math.floor(seconds / 60)}:
                          {String(seconds % 60).padStart(2, "0")}
                        </p>
                        <TimerEditButton
                          label="Edit set duration"
                          onClick={() => beginTimerEdit("set")}
                        />
                      </>
                    )}
                  </div>
                ) : null}
                <div className="mt-5 flex justify-center gap-3">
                  <button
                    aria-label={paused ? "Resume workout" : "Pause workout"}
                    className="grid h-12 w-12 place-items-center rounded-xl border border-emerald-600 text-[0px] text-emerald-700 transition hover:bg-emerald-100"
                    onClick={togglePause}
                    title={paused ? "Resume" : "Pause"}
                    type="button"
                  >
                    {paused ? (
                      <Play
                        aria-hidden="true"
                        className="h-5 w-5 fill-current"
                      />
                    ) : (
                      <Pause aria-hidden="true" className="h-5 w-5" />
                    )}
                    {paused ? "▶" : "⏸"}
                  </button>
                  <Button
                    aria-label="Complete set"
                    className="grid h-12 w-12 place-items-center p-0 text-[0px]"
                    disabled={paused}
                    onClick={completeSet}
                    title="Complete set"
                  >
                    <SkipForward aria-hidden="true" className="h-5 w-5" />⏭
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-900 p-4 text-center text-white">
                <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300">
                  Rest
                </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  {editingTimer === "rest" ? (
                    <TimerEditor
                      dark
                      label="Rest duration in seconds"
                      onCancel={cancelTimerEdit}
                      onChange={setTimerValue}
                      onSave={() => void saveTimerEdit()}
                      value={timerValue}
                    />
                  ) : (
                    <>
                      <p className="text-6xl font-bold tabular-nums">
                        {Math.floor(seconds / 60)}:
                        {String(seconds % 60).padStart(2, "0")}
                      </p>
                      <TimerEditButton
                        dark
                        label="Edit rest duration"
                        onClick={() => beginTimerEdit("rest")}
                      />
                    </>
                  )}
                </div>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    aria-label={paused ? "Resume rest" : "Pause rest"}
                    className="grid h-12 w-12 place-items-center rounded-xl bg-white/15 text-[0px] text-white transition hover:bg-white/25"
                    onClick={togglePause}
                    title={paused ? "Resume" : "Pause"}
                    type="button"
                  >
                    {paused ? (
                      <Play
                        aria-hidden="true"
                        className="h-5 w-5 fill-current"
                      />
                    ) : (
                      <Pause aria-hidden="true" className="h-5 w-5" />
                    )}
                    {paused ? "▶" : "⏸"}
                  </button>
                  <button
                    aria-label="Skip rest"
                    className="grid h-12 w-12 place-items-center rounded-xl bg-white text-[0px] text-slate-900 transition hover:bg-slate-100"
                    onClick={() => {
                      setSeconds(0);
                      advanceFromRest();
                    }}
                    title="Skip rest"
                    type="button"
                  >
                    <SkipForward aria-hidden="true" className="h-5 w-5" />⏭
                  </button>
                </div>
              </div>
            )}
          </section>
          <ExerciseDemonstration
            isAnimating={isMusicPlaying}
            name={current.name}
            visual={getExerciseVisual(current.name)}
          />
        </div>
        {message ? (
          <p aria-live="polite" className="mt-4 text-sm text-red-600">
            {message}
          </p>
        ) : null}
        <div className="mt-8 flex justify-end">
          <button
            className="text-sm font-semibold text-slate-900"
            onClick={() => {
              if (
                window.confirm(
                  "End this workout? Your completed sets will be saved.",
                )
              )
                void finish("ended_early");
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
