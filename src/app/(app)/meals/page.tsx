import { EmptyState } from "@/components/ui";
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
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label
          className="text-sm font-semibold text-slate-700"
          htmlFor="meal-description"
        >
          What did you eat?
        </label>
        <textarea
          className="mt-2 min-h-32 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
          id="meal-description"
          placeholder="e.g. Two eggs, avocado toast, and a latte"
        />
        <button
          className="mt-4 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white opacity-50"
          disabled
          type="button"
        >
          Analyze meal (coming soon)
        </button>
      </section>
      <div className="mt-7">
        <EmptyState
          title="Your meal history is empty"
          description="After meal parsing is connected, saved meals will show up here."
        />
      </div>
    </>
  );
}
