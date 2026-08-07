"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { ExerciseMuscleMap } from "@/components/exercise-visuals";
import {
  demoFrames,
  exerciseGroups,
  getExerciseVisual,
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
  const visual = candidate ? getExerciseVisual(candidate) : undefined;

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
          <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-emerald-700">
                  EXERCISE LIBRARY
                </p>
                <h2 className="mt-1 text-xl font-bold">Choose an exercise</h2>
              </div>
              <button
                aria-label="Close exercise selector"
                className="grid h-9 w-9 place-items-center rounded-lg text-[0px] text-slate-500 hover:bg-slate-100"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="h-5 w-5" />×
              </button>
            </header>
            <div className="p-5">
              {!group ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {exerciseGroups.map((item) => (
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
                    {exerciseGroups
                      .find((item) => item.label === group)
                      ?.exercises.map((name) => (
                        <button
                          className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:border-emerald-400 hover:bg-emerald-50"
                          key={name}
                          onClick={() => chooseExercise(name)}
                          type="button"
                        >
                          {name}
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
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
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
            <footer className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4">
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
