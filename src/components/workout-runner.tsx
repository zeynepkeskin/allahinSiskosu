"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExerciseDemonstration } from "@/components/exercise-visuals";
import { Button, Card, ProgressBar } from "@/components/ui";
import { getExerciseVisual } from "@/lib/exercise-catalog";
import { exercisePrescription, type ExercisePlan } from "@/lib/exercises";

type Phase = "ready" | "cue" | "set" | "rest" | "complete" | "ended";
type AudioContextConstructor = typeof AudioContext;

const ordinal = (number: number) =>
  number === 1
    ? "First"
    : number === 2
      ? "Second"
    : number === 3
      ? "Third"
        : `${number}th`;

const soundtrackCount = 6;

export function WorkoutRunner({ plan }: { plan: ExercisePlan }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("ready"),
    [exerciseIndex, setExerciseIndex] = useState(0),
    [setNumber, setSetNumber] = useState(1),
    [seconds, setSeconds] = useState(0),
    [paused, setPaused] = useState(false),
    [muted, setMuted] = useState(false),
    [musicEnabled, setMusicEnabled] = useState(true),
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
  const current = plan.exercises[exerciseIndex];

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
  }

  function pauseMusic() {
    music.current?.pause();
  }

  async function playMusic(enabled = musicEnabled) {
    if (!enabled || !music.current) return;
    try {
      await music.current.play();
    } catch {
      setMessage("Music could not start. Use the Music on button to try again.");
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
      const next = plan.exercises[nextIndex];
      setExerciseIndex(nextIndex);
      void startSet(1, next, true);
    } else {
      void finish("completed");
    }
  }

  useEffect(() => {
    if (phase !== "rest" || paused) return;
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
  }, [phase, paused]);

  useEffect(() => {
    if (phase !== "set" || current.setDurationSeconds === null) return;
    deadline.current = Date.now() + current.setDurationSeconds * 1000;
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
  }, [phase, exerciseIndex, setNumber]);

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
    } else setPaused(true);
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
              {exercisePrescription(current)}
            </p>
          </div>
          <button
            aria-pressed={muted}
            className="h-fit rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"
            onClick={() => {
              if (!muted) {
                stopCues();
                if (phase === "cue") setPhase("set");
              }
              setMuted((value) => !value);
            }}
            type="button"
          >
            {muted ? "Sound off" : "Sound on"}
          </button>
          <button
            aria-pressed={musicEnabled}
            className="h-fit rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"
            onClick={() => {
              const nextEnabled = !musicEnabled;
              setMusicEnabled(nextEnabled);
              if (nextEnabled && musicStarted.current)
                void playMusic(nextEnabled);
              else if (!nextEnabled) pauseMusic();
            }}
            type="button"
          >
            {musicEnabled ? "Music on" : "Music off"}
          </button>
        </div>
        <div className="mt-8">
          <ProgressBar
            label={`Set ${setNumber} of ${current.sets} · Exercise ${exerciseIndex + 1} of ${plan.exercises.length}`}
            value={(doneSets / totalSets) * 100}
          />
        </div>
        {phase !== "ready" ? (
          <ExerciseDemonstration
            name={current.name}
            visual={getExerciseVisual(current.name)}
          />
        ) : null}
        {phase === "ready" ? (
          <>
            <p className="mt-8 text-sm text-slate-500">
              Start to hear the exercise prescription and a 3–2–1 countdown.
            </p>
            <Button className="mt-4" onClick={begin}>
              Begin workout
            </Button>
          </>
        ) : phase === "cue" ? (
          <div
            aria-live="polite"
            className="mt-9 rounded-2xl bg-emerald-50 p-6 text-center"
          >
            <p className="text-lg font-semibold">
              Get ready for set {setNumber}
            </p>
            <p className="mt-2 text-sm text-slate-600">3 • 2 • 1 • go</p>
          </div>
        ) : phase === "set" ? (
          <div className="mt-9 rounded-2xl bg-emerald-50 p-6 text-center">
            <p className="text-lg font-semibold">
              Set {setNumber}: {current.reps} reps
            </p>
            {current.setDurationSeconds !== null ? (
              <p className="mt-2 text-4xl font-bold tabular-nums text-slate-900">
                {Math.floor(seconds / 60)}:
                {String(seconds % 60).padStart(2, "0")}
              </p>
            ) : null}
            <Button className="mt-5" onClick={completeSet}>
              Complete set
            </Button>
          </div>
        ) : (
          <div className="mt-9 rounded-2xl bg-slate-900 p-6 text-center text-white">
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300">
              Rest
            </p>
            <p className="mt-2 text-6xl font-bold tabular-nums">
              {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold"
                onClick={togglePause}
                type="button"
              >
                {paused ? "Resume" : "Pause"}
              </button>
              <button
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                onClick={() => {
                  setSeconds(0);
                  advanceFromRest();
                }}
                type="button"
              >
                Skip rest
              </button>
            </div>
          </div>
        )}
        {message ? (
          <p aria-live="polite" className="mt-4 text-sm text-red-600">
            {message}
          </p>
        ) : null}
        <button
          className="mt-8 text-sm font-semibold text-red-600"
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
      </Card>
    </div>
  );
}
