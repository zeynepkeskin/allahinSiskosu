import { NutritionCoachPanel } from "@/components/nutrition-coach";

export default function CoachPage() {
  return (
    <>
      <header>
        <p className="text-sm font-semibold text-emerald-600">
          AI NUTRITION COACH
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Make your meal log work harder
        </h1>
        <p className="mt-2 text-slate-500">
          A supportive look at your daily and weekly nutrition patterns.
        </p>
      </header>
      <NutritionCoachPanel />
    </>
  );
}
