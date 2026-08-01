import { WellnessCoachPanel } from "@/components/nutrition-coach";

export default function CoachPage() {
  return (
    <>
      <header>
        <p className="text-sm font-semibold text-emerald-600">AI COACH</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Make your nutrition and training work together
        </h1>
        <p className="mt-2 text-slate-500">
          A supportive look at your meals and completed strength workouts.
        </p>
      </header>
      <WellnessCoachPanel />
    </>
  );
}
