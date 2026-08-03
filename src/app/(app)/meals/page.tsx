import { MealsWorkspace } from "@/components/meals-workspace";

export default async function MealsPage() {
  return (
    <>
      <header>
        <p className="text-sm font-semibold text-emerald-600">EAT LOG</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Add an eat</h1>
        <p className="mt-2 text-slate-500">
          Describe what you ate in your own words.
        </p>
      </header>
      <MealsWorkspace />
    </>
  );
}
