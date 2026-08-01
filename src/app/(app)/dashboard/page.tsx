import Link from "next/link";
import { Card, EmptyState, ProgressBar } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

type MealRow = {
  id: string;
  meal_name: string;
  meal_time: string;
  total_calories: number | string;
  protein: number | string;
  carbs: number | string;
  fat: number | string;
};

const number = (value: number | string) => Number(value) || 0;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayLabel(date: Date) {
  return new Intl.DateTimeFormat("en", { weekday: "short" }).format(date);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date();
  const today = startOfDay(now);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);

  const [{ data: profile }, { data: meals }] = await Promise.all([
    supabase
      .from("profiles")
      .select("daily_calorie_goal")
      .eq("id", user!.id)
      .maybeSingle(),
    supabase
      .from("meals")
      .select("id, meal_name, meal_time, total_calories, protein, carbs, fat")
      .eq("profile_id", user!.id)
      .gte("meal_time", weekStart.toISOString())
      .order("meal_time", { ascending: false }),
  ]);

  const recentMeals = (meals ?? []) as MealRow[];
  const todayMeals = recentMeals.filter((meal) => {
    const mealDate = new Date(meal.meal_time);
    return (
      mealDate >= today && mealDate < new Date(today.getTime() + 86_400_000)
    );
  });
  const totals = todayMeals.reduce(
    (sum, meal) => ({
      calories: sum.calories + number(meal.total_calories),
      protein: sum.protein + number(meal.protein),
      carbs: sum.carbs + number(meal.carbs),
      fat: sum.fat + number(meal.fat),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const goal = profile?.daily_calorie_goal ?? null;
  const remaining = goal === null ? null : Math.max(goal - totals.calories, 0);
  const dailyCalories = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    return {
      label: dayLabel(date),
      calories: recentMeals
        .filter((meal) => {
          const mealDate = new Date(meal.meal_time);
          return mealDate >= date && mealDate < nextDate;
        })
        .reduce((sum, meal) => sum + number(meal.total_calories), 0),
    };
  });
  const loggedDays = dailyCalories.filter((day) => day.calories > 0);
  const weeklyAverage = loggedDays.length
    ? Math.round(
        loggedDays.reduce((sum, day) => sum + day.calories, 0) /
          loggedDays.length,
      )
    : null;
  const chartMaximum = Math.max(
    goal ?? 0,
    ...dailyCalories.map((day) => day.calories),
    1,
  );

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-emerald-600">OVERVIEW</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Good day!</h1>
          <p className="mt-2 text-slate-500">
            Here&apos;s how today&apos;s nutrition is shaping up.
          </p>
        </div>
        <Link
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          href="/meals"
        >
          + Add meal
        </Link>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Calories today"
          value={`${totals.calories} kcal`}
          hint={goal ? `Goal: ${goal} kcal` : "Set your daily goal"}
        />
        <Stat
          label="Remaining"
          value={remaining === null ? "—" : `${remaining} kcal`}
          hint={
            goal
              ? totals.calories > goal
                ? `${totals.calories - goal} kcal over goal`
                : "Within your daily target"
              : "Complete your profile"
          }
        />
        <Stat
          label="Protein"
          value={`${Math.round(totals.protein)} g`}
          hint="Logged today"
        />
        <Stat
          label="Weekly average"
          value={weeklyAverage === null ? "—" : `${weeklyAverage} kcal`}
          hint={
            weeklyAverage === null
              ? "No meals logged this week"
              : "Across logged days"
          }
        />
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <h2 className="font-semibold">Daily progress</h2>
          <p className="mt-1 text-sm text-slate-500">
            Macros logged with today&apos;s meals.
          </p>
          <div className="mt-6 space-y-5">
            <ProgressBar
              label={`Protein · ${Math.round(totals.protein)}g`}
              value={goal ? (totals.protein * 4 * 100) / goal : 0}
            />
            <ProgressBar
              label={`Carbs · ${Math.round(totals.carbs)}g`}
              value={goal ? (totals.carbs * 4 * 100) / goal : 0}
            />
            <ProgressBar
              label={`Fat · ${Math.round(totals.fat)}g`}
              value={goal ? (totals.fat * 9 * 100) / goal : 0}
            />
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <h2 className="font-semibold">This week</h2>
          <div
            aria-label="Calories logged over the last seven days"
            className="mt-8 flex h-36 items-end gap-2"
          >
            {dailyCalories.map((day) => (
              <div
                className="flex h-full flex-1 flex-col justify-end gap-2"
                key={day.label}
                title={`${day.label}: ${day.calories} kcal`}
              >
                <div
                  className="min-h-1 rounded-t-md bg-emerald-500"
                  style={{ height: `${(day.calories / chartMaximum) * 100}%` }}
                />
                <span className="text-center text-xs text-slate-500">
                  {day.label}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-slate-500">
            {weeklyAverage === null
              ? "Log meals to see your calorie trend."
              : `Average: ${weeklyAverage} kcal per logged day.`}
          </p>
        </Card>
      </div>

      <section className="mt-7">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-semibold">Today&apos;s meals</h2>
            <p className="mt-1 text-sm text-slate-500">
              Your most recently logged meals appear first.
            </p>
          </div>
          {todayMeals.length ? (
            <Link
              className="text-sm font-semibold text-emerald-700"
              href="/meals"
            >
              View all meals →
            </Link>
          ) : null}
        </div>
        {todayMeals.length === 0 ? (
          <EmptyState
            title="No meals logged today"
            description="Tell us what you ate and review the nutrition estimate before saving it."
            action={
              <Link
                className="text-sm font-semibold text-emerald-700"
                href="/meals"
              >
                Log your first meal →
              </Link>
            }
          />
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="divide-y divide-slate-100">
              {todayMeals.map((meal) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                  key={meal.id}
                >
                  <div>
                    <h3 className="font-medium">{meal.meal_name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(meal.meal_time).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex gap-4 text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">
                      {number(meal.total_calories)} kcal
                    </span>
                    <span>P {number(meal.protein)}g</span>
                    <span>C {number(meal.carbs)}g</span>
                    <span>F {number(meal.fat)}g</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>
    </>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{hint}</p>
    </Card>
  );
}
