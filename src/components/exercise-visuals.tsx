import Image from "next/image";
import {
  demoFrames,
  muscleLabels,
  type BodyView,
  type ExerciseVisual,
  type MuscleId,
} from "@/lib/exercise-catalog";

const primaryColor = "#059669";
const secondaryColor = "#6ee7b7";

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
  return (
    <figure className="min-w-0 flex-1 text-center">
      <svg
        aria-label={`${view === "front" ? "Front" : "Back"} body map`}
        className="mx-auto h-32 w-20"
        role="img"
        viewBox="0 0 100 180"
      >
        <title>{view === "front" ? "Front body map" : "Back body map"}</title>
        <circle cx="50" cy="15" fill="#dbe4f0" r="11" />
        <path d="M43 27h14v10H43z" fill="#dbe4f0" />
        <path
          d="M31 39Q50 31 69 39l7 32-9 22 3 16H30l3-16-9-22z"
          fill="#dbe4f0"
        />
        <path
          d="M31 42Q19 48 17 68l8 4 10-20M69 42q12 6 14 26l-8 4-10-20"
          fill="none"
          stroke="#dbe4f0"
          strokeLinecap="round"
          strokeWidth="11"
        />
        <path d="M38 107 31 169h15l4-45 4 45h15l-7-62z" fill="#dbe4f0" />
        {view === "front" ? (
          <>
            <path
              d="M28 42q7-7 15 1l-3 12-13-3zM72 42q-7-7-15 1l3 12 13-3z"
              fill={fill("side-delts")}
            />
            <path
              d="M34 51q8-5 15 2v14H33q-3-10 1-16M66 51q-8-5-15 2v14h16q3-10-1-16"
              fill={fill("chest")}
            />
            <path
              d="M30 54q-7 7-4 19l7 2 5-17zM70 54q7 7 4 19l-7 2-5-17z"
              fill={fill("biceps")}
            />
            <path
              d="m24 75-4 18 7 2 5-18M76 75l4 18-7 2-5-18"
              fill={fill("forearms")}
            />
            <path d="M41 69h18v28H41z" fill={fill("abs")} />
            <path
              d="m37 71 4 25-8-5-2-14zM63 71l-4 25 8-5 2-14z"
              fill={fill("obliques")}
            />
            <path
              d="m38 108-4 39h15v-39zM62 108l4 39H51v-39z"
              fill={fill("quads")}
            />
            <path
              d="m33 148-2 18h10l3-18M67 148l2 18H59l-3-18"
              fill={fill("calves")}
            />
            <path
              d="M29 43q6-6 14 1l-3 9-12-2zM71 43q-6-6-14 1l3 9 12-2z"
              fill={fill("front-delts")}
            />
          </>
        ) : (
          <>
            <path
              d="M29 43q6-6 14 1l-3 9-12-2zM71 43q-6-6-14 1l3 9 12-2z"
              fill={fill("rear-delts")}
            />
            <path d="M39 35h22l-5 17H44z" fill={fill("traps")} />
            <path d="M35 51h30l-5 29H40z" fill={fill("upper-back")} />
            <path
              d="m37 54 12 27-16-4zM63 54 51 81l16-4z"
              fill={fill("lats")}
            />
            <path d="M43 78h14v18H43z" fill={fill("lower-back")} />
            <path
              d="M30 54q-7 7-4 20l7 4 5-17zM70 54q7 7 4 20l-7 4-5-17z"
              fill={fill("triceps")}
            />
            <path d="m38 99 12 12 12-12-1 16H39z" fill={fill("glutes")} />
            <path
              d="m38 110-4 37h15v-34zM62 110l4 37H51v-34z"
              fill={fill("hamstrings")}
            />
            <path
              d="m33 148-2 18h10l3-18M67 148l2 18H59l-3-18"
              fill={fill("calves")}
            />
          </>
        )}
      </svg>
      <figcaption className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {view}
      </figcaption>
    </figure>
  );
}

export function ExerciseMuscleMap({ visual }: { visual?: ExerciseVisual }) {
  if (!visual)
    return (
      <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
        Visual guidance is not available for this custom exercise.
      </p>
    );
  const names = (muscles: MuscleId[]) =>
    muscles.map((muscle) => muscleLabels[muscle]).join(", ");
  return (
    <section
      aria-label="Target muscles"
      className="mt-3 rounded-xl bg-emerald-50/70 p-3"
    >
      <div className="flex justify-center gap-2">
        {visual.views.map((view) => (
          <MuscleBody key={view} view={view} visual={visual} />
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-700">
        <span className="font-semibold text-emerald-800">Primary:</span>{" "}
        {names(visual.primary)}
      </p>
      {visual.secondary.length ? (
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
}: {
  name: string;
  visual?: ExerciseVisual;
}) {
  if (!visual?.demoId)
    return (
      <p className="mt-6 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
        Two-frame form guidance is not available for this exercise yet.
      </p>
    );
  const frames = demoFrames(visual.demoId);
  return (
    <section aria-label={`${name} demonstration`} className="mt-6">
      <h2 className="text-sm font-semibold text-slate-700">Form reference</h2>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {(["start", "finish"] as const).map((position) => (
          <figure
            className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            key={position}
          >
            <Image
              alt={`${name}: ${position} position`}
              className="aspect-[4/3] w-full object-contain"
              height={300}
              priority
              src={frames[position]}
              width={400}
            />
            <figcaption className="border-t border-slate-100 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
              {position}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
