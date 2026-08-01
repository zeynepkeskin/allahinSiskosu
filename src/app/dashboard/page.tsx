import Link from "next/link";
import { NutritionCard } from "@/components/nutrition-card";
import { PageHeading } from "@/components/page-heading";

const meals = [
  {
    name: "Greek yogurt bowl",
    time: "8:15 AM",
    calories: "340 kcal",
    detail: "32g protein · 38g carbs",
  },
  {
    name: "Chicken & rice",
    time: "12:40 PM",
    calories: "610 kcal",
    detail: "48g protein · 65g carbs",
  },
];
export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Thursday, July 31"
        title="Good morning"
        description="Here’s a clear view of today’s nutrition."
        action={
          <Link
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            href="/meals/new"
          >
            + Add meal
          </Link>
        }
      />
      <section
        className="grid gap-4 sm:grid-cols-3"
        aria-label="Today’s macro progress"
      >
        <NutritionCard
          color="emerald"
          detail="of 140g target"
          label="Protein"
          value="80g"
        />
        <NutritionCard
          color="amber"
          detail="of 220g target"
          label="Carbs"
          value="103g"
        />
        <NutritionCard
          color="rose"
          detail="of 65g target"
          label="Fat"
          value="29g"
        />
      </section>
      <section className="rounded-3xl bg-stone-950 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-stone-300">
              Today&apos;s calorie budget
            </p>
            <p className="mt-2 text-4xl font-bold tracking-tight">
              950{" "}
              <span className="text-lg font-medium text-stone-400">
                kcal left
              </span>
            </p>
          </div>
          <p className="text-sm text-stone-300">1,150 of 2,100 kcal logged</p>
        </div>
        <div
          aria-label="55 percent of calorie budget used"
          className="mt-6 h-3 overflow-hidden rounded-full bg-stone-700"
        >
          <div className="h-full w-[55%] rounded-full bg-emerald-400" />
        </div>
      </section>
      <section className="rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4 sm:px-6">
          <h2 className="font-semibold text-stone-950">Today&apos;s meals</h2>
          <Link
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            href="/meals/new"
          >
            Add another
          </Link>
        </div>
        <ul className="divide-y divide-stone-100">
          {meals.map((meal) => (
            <li
              className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"
              key={meal.name}
            >
              <div>
                <p className="font-medium text-stone-900">{meal.name}</p>
                <p className="mt-1 text-sm text-stone-500">
                  {meal.time} · {meal.detail}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-stone-700">
                {meal.calories}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
