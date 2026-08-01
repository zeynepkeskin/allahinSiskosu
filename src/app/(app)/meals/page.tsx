import { MealsWorkspace } from "@/components/meals-workspace";
export default function MealsPage() {
  return (
    <>
      <header>
        <p className="text-sm font-semibold text-emerald-600">MEAL LOG</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Add a meal</h1>
        <p className="mt-2 text-slate-500">
          Describe what you ate in your own words.
        </p>
      </header>
      <MealsWorkspace />
    </>
  );
}
