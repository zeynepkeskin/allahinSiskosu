import Image from "next/image";
import { useEffect, useState, type KeyboardEvent } from "react";
import { MALE_BACK, MALE_FRONT } from "@musclemap/assets";
import type { MuscleGroup } from "@musclemap/core";
import {
  demoFrames,
  muscleLabels,
  type BodyView,
  type ExerciseVisual,
  type MuscleId,
} from "@/lib/exercise-catalog";

const primaryColor = "#059669";
const secondaryColor = "#6ee7b7";

const muscleGroups: Record<MuscleId, MuscleGroup> = {
  biceps: "BICEPS",
  triceps: "TRICEPS",
  forearms: "FOREARMS",
  chest: "CHEST",
  "front-delts": "SHOULDERS_FRONT",
  "side-delts": "SHOULDERS_SIDE",
  "rear-delts": "SHOULDERS_REAR",
  lats: "LATS",
  "upper-back": "BACK_UPPER",
  "lower-back": "BACK_LOWER",
  traps: "TRAPEZIUS",
  abs: "CORE",
  obliques: "OBLIQUES",
  glutes: "GLUTES",
  quads: "QUADS",
  hamstrings: "HAMSTRINGS",
  calves: "CALVES",
};

function colorFor(
  muscle: MuscleId,
  primary: MuscleId[],
  secondary: MuscleId[],
) {
  return primary.includes(muscle)
    ? primaryColor
    : secondary.includes(muscle)
      ? secondaryColor
      : "#cbd5e1";
}

function MuscleBody({
  view,
  visual,
}: {
  view: BodyView;
  visual: ExerciseVisual;
}) {
  const fill = (muscle: MuscleId) =>
    colorFor(muscle, visual.primary, visual.secondary);
  const diagram = view === "front" ? MALE_FRONT : MALE_BACK;
  const muscleFill = (group: MuscleGroup) => {
    const muscle = (Object.keys(muscleGroups) as MuscleId[]).find(
      (key) => muscleGroups[key] === group,
    );
    return muscle ? fill(muscle) : "#d9e2ec";
  };
  const mirror = `translate(${diagram.centerX * 2} 0) scale(-1 1)`;
  return (
    <figure className="min-w-0 flex-1 text-center">
      <svg
        aria-label={`${view === "front" ? "Front" : "Back"} body map`}
        className="mx-auto h-36 w-24"
        role="img"
        viewBox={diagram.viewBox}
      >
        <title>{view === "front" ? "Front body map" : "Back body map"}</title>
        {diagram.outline.map((path) => (
          <g key={path.id}>
            <path d={path.d} fill="#eef2f7" />
            {path.side === "LEFT" ? (
              <path d={path.d} fill="#eef2f7" transform={mirror} />
            ) : null}
          </g>
        ))}
        {diagram.muscles.map((path) => (
          <g key={path.id ?? `${path.group}-${path.side}`}>
            <path d={path.d} fill={muscleFill(path.group)} />
            {path.side === "LEFT" ? (
              <path
                d={path.d}
                fill={muscleFill(path.group)}
                transform={mirror}
              />
            ) : null}
          </g>
        ))}
      </svg>
      <figcaption className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {view}
      </figcaption>
    </figure>
  );
}

export function ExerciseMuscleFilter({
  value,
  onChange,
}: {
  value?: MuscleId;
  onChange: (muscle?: MuscleId) => void;
}) {
  const [view, setView] = useState<BodyView>("front");
  const diagram = view === "front" ? MALE_FRONT : MALE_BACK;
  const mirror = `translate(${diagram.centerX * 2} 0) scale(-1 1)`;
  const muscleFor = (group: MuscleGroup) =>
    (Object.keys(muscleGroups) as MuscleId[]).find(
      (key) => muscleGroups[key] === group,
    );

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-600">Target muscle</p>
        <button
          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
          onClick={() =>
            setView((current) => (current === "front" ? "back" : "front"))
          }
          type="button"
        >
          Show {view === "front" ? "back" : "front"}
        </button>
      </div>
      <div className="mt-2 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <svg
          aria-label={`Select a muscle on the ${view} body view`}
          className="h-44 w-28 shrink-0"
          role="group"
          viewBox={diagram.viewBox}
        >
          <title>Clickable {view} muscle filter</title>
          {diagram.outline.map((path) => (
            <g key={path.id}>
              <path d={path.d} fill="#e2e8f0" />
              {path.side === "LEFT" ? (
                <path d={path.d} fill="#e2e8f0" transform={mirror} />
              ) : null}
            </g>
          ))}
          {diagram.muscles.map((path) => {
            const muscle = muscleFor(path.group);
            const selected = muscle === value;
            const props = muscle
              ? {
                  "aria-label": `Filter by ${muscleLabels[muscle]}`,
                  className:
                    "cursor-pointer outline-none hover:opacity-75 focus:stroke-emerald-900 focus:stroke-[3]",
                  fill: selected ? primaryColor : "#94a3b8",
                  onClick: () => onChange(selected ? undefined : muscle),
                  onKeyDown: (event: KeyboardEvent<SVGPathElement>) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onChange(selected ? undefined : muscle);
                    }
                  },
                  role: "button",
                  tabIndex: 0,
                }
              : { fill: "#cbd5e1" };
            return (
              <g key={path.id ?? `${path.group}-${path.side}`}>
                <path d={path.d} {...props} />
                {path.side === "LEFT" ? (
                  <path d={path.d} transform={mirror} {...props} />
                ) : null}
              </g>
            );
          })}
        </svg>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            {value ? muscleLabels[value] : "All muscles"}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Click a highlighted body region to filter. Flip the body to reach
            muscles on the other side.
          </p>
          {value ? (
            <button
              className="mt-2 text-xs font-semibold text-emerald-700"
              onClick={() => onChange(undefined)}
              type="button"
            >
              Clear muscle
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ExerciseMuscleMap({
  visual,
  views,
}: {
  visual?: ExerciseVisual;
  views?: BodyView[];
}) {
  const displayVisual: ExerciseVisual = visual ?? {
    category: "Exercise",
    popularity: "common",
    equipment: [],
    primary: [],
    secondary: [],
    views: ["front", "back"],
  };
  const names = (muscles: MuscleId[]) =>
    muscles.map((muscle) => muscleLabels[muscle]).join(", ");
  return (
    <section
      aria-label="Target muscles"
      className="mt-3 rounded-xl bg-emerald-50/70 p-3"
    >
      <div className="flex justify-center gap-2">
        {(views ?? displayVisual.views).map((view) => (
          <MuscleBody key={view} view={view} visual={displayVisual} />
        ))}
      </div>
      {visual ? (
        <p className="mt-2 text-xs text-slate-700">
          <span className="font-semibold text-emerald-800">Primary:</span>{" "}
          {names(visual.primary)}
        </p>
      ) : null}
      {visual?.secondary.length ? (
        <p className="mt-1 text-xs text-slate-600">
          <span className="font-semibold">Secondary:</span>{" "}
          {names(visual.secondary)}
        </p>
      ) : null}
    </section>
  );
}

export function ExerciseDemonstration({
  name,
  visual,
  isAnimating = false,
}: {
  name: string;
  visual?: ExerciseVisual;
  isAnimating?: boolean;
}) {
  const [position, setPosition] = useState<"start" | "finish">("start");

  useEffect(() => {
    if (!isAnimating) return;
    const timer = window.setInterval(() => {
      setPosition((current) => (current === "start" ? "finish" : "start"));
    }, 800);
    return () => window.clearInterval(timer);
  }, [isAnimating]);

  if (!visual?.demoId)
    return (
      <p className="grid aspect-[4/3] place-items-center rounded-xl bg-slate-50 p-3 text-center text-sm text-slate-500">
        Two-frame form guidance is not available for this exercise yet.
      </p>
    );
  const frames = demoFrames(visual.demoId);
  return (
    <figure
      aria-label={`${name} demonstration`}
      className="aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <Image
        alt={`${name}: ${position} position`}
        className="h-full w-full rounded-xl p-3 object-contain"
        height={300}
        priority
        src={frames[position]}
        width={400}
      />
    </figure>
  );
}
