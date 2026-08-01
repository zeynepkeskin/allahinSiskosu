import Link from "next/link";
import { PageHeading } from "@/components/page-heading";

export default function AddMealPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <Link
          className="inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          href="/dashboard"
        >
          ← Back to dashboard
        </Link>
        <PageHeading
          description="Describe what you ate in your own words. We’ll turn it into a nutrition breakdown for you to review."
          eyebrow="Meal log"
          title="Add a meal"
        />
        <form className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
          <fieldset>
            <legend className="text-sm font-semibold text-stone-900">
              When did you eat?
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {["Breakfast", "Lunch", "Dinner", "Snack"].map((mealType) => (
                <label
                  className="cursor-pointer rounded-xl border border-stone-200 px-3 py-2.5 text-center text-sm font-medium text-stone-700 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-800"
                  key={mealType}
                >
                  <input
                    className="sr-only"
                    defaultChecked={mealType === "Lunch"}
                    name="meal-type"
                    type="radio"
                  />
                  {mealType}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-7">
            <label
              className="text-sm font-semibold text-stone-900"
              htmlFor="meal-description"
            >
              What did you eat?
            </label>
            <textarea
              className="mt-2 min-h-36 w-full resize-y rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none placeholder:text-stone-400 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100"
              id="meal-description"
              name="meal-description"
              placeholder="For example: grilled chicken, a cup of rice, roasted vegetables, and sparkling water"
            />
            <p className="mt-2 text-sm text-stone-500">
              Include portions when you know them for a more accurate estimate.
            </p>
          </div>
          <button
            className="mt-7 w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-emerald-700"
            type="button"
          >
            Analyze meal
          </button>
          <p className="mt-3 text-center text-xs leading-5 text-stone-500">
            Meal analysis and saving will be connected in the next phase.
          </p>
        </form>
      </div>
    </main>
  );
}
