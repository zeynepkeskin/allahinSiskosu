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
  const active = [...visual.primary, ...visual.secondary];
  return (
    <figure className="min-w-0 flex-1 text-center">
      <svg
        aria-label={`${view === "front" ? "Front" : "Back"} body map`}
        className="mx-auto h-40 w-24"
        role="img"
        viewBox="0 0 100 190"
      >
        <title>{view === "front" ? "Front body map" : "Back body map"}</title>
        <circle cx="50" cy="17" fill="#e2e8f0" r="12" />
        <path d="M39 31h22l11 33-9 37H37l-9-37z" fill="#e2e8f0" />
        <path
          d="M37 38 19 68l8 5 19-19M63 38l18 30-8 5-19-19"
          fill="none"
          stroke="#e2e8f0"
          strokeLinecap="round"
          strokeWidth="10"
        />
        <path d="m39 97-8 69 11 1 10-55 10 55 11-1-8-69z" fill="#e2e8f0" />
        {view === "front" ? (
          <>
            <path
              d="M31 38q8-8 16 1v17H31q-5-9 0-18M69 38q-8-8-16 1v17h16q5-9 0-18"
              fill={fill("side-delts")}
            />
            <path
              d="M34 48q8-7 16 1v19H32q-3-12 2-20M66 48q-8-7-16 1v19h18q3-12-2-20"
              fill={fill("chest")}
            />
            <path
              d="M31 56q-8 4-6 19l8 6 6-19zM69 56q8 4 6 19l-8 6-6-19z"
              fill={fill("biceps")}
            />
            <path
              d="M25 75l-5 18 8 2 5-17M75 75l5 18-8 2-5-17"
              fill={fill("forearms")}
            />
            <path d="M40 69h20v29H40z" fill={fill("abs")} />
            <path
              d="m37 71 3 25-8-5-2-15zM63 71l-3 25 8-5 2-15z"
              fill={fill("obliques")}
            />
            <path
              d="m38 101-5 45 16-1V102zM62 101l5 45-16-1v-43z"
              fill={fill("quads")}
            />
            <path
              d="m34 147-2 18 9 1 4-19M66 147l2 18-9 1-4-19"
              fill={fill("calves")}
            />
            <path
              d="M34 38q5-7 12 1v9H34zM66 38q-5-7-12 1v9h12z"
              fill={fill("front-delts")}
            />
          </>
        ) : (
          <>
            <path
              d="M34 38q6-7 13 2v14H31q-3-9 3-16M66 38q-6-7-13 2v14h16q3-9-3-16"
              fill={fill("rear-delts")}
            />
            <path d="M39 34h22l-5 18H44z" fill={fill("traps")} />
            <path d="M34 50h32l-5 31H39z" fill={fill("upper-back")} />
            <path
              d="m39 57 10 25-15-3zM61 57 51 82l15-3z"
              fill={fill("lats")}
            />
            <path d="M43 79h14v18H43z" fill={fill("lower-back")} />
            <path
              d="M30 56q-7 7-3 22l7 5 4-18zM70 56q7 7 3 22l-7 5-4-18z"
              fill={fill("triceps")}
            />
            <path d="m38 97 12 13 12-13-1 17H39z" fill={fill("glutes")} />
            <path
              d="m39 110-5 37 16-1v-32zM61 110l5 37-16-1v-32z"
              fill={fill("hamstrings")}
            />
            <path
              d="m34 147-2 18 9 1 4-19M66 147l2 18-9 1-4-19"
              fill={fill("calves")}
            />
          </>
        )}
        {active.includes("front-delts") && view === "front" ? null : null}
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
