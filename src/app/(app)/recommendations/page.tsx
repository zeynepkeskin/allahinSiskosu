import { FoodRecommendation } from "@/components/food-recommendation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export default async function RecommendationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const today = startOfDay(new Date());
  const [
    { data: profile },
    { data: meals },
    { data: plans },
    { data: sessions },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("daily_calorie_goal")
      .eq("id", user!.id)
      .maybeSingle(),
    supabase
      .from("meals")
      .select("total_calories")
      .eq("profile_id", user!.id)
      .gte("meal_time", today.toISOString()),
    supabase
      .from("exercise_plans")
      .select("id, is_rest_day")
      .eq("profile_id", user!.id)
      .eq("day_of_week", today.getDay())
      .maybeSingle(),
    supabase
      .from("workout_sessions")
      .select("status")
      .eq("profile_id", user!.id)
      .gte("started_at", today.toISOString())
      .order("started_at", { ascending: false })
      .limit(1),
  ]);
  const caloriesLogged = (meals ?? []).reduce(
    (total, meal) => total + (Number(meal.total_calories) || 0),
    0,
  );
  const dailyGoal = profile?.daily_calorie_goal ?? null;
  const remaining =
    dailyGoal === null ? null : Math.max(dailyGoal - caloriesLogged, 0);
  const workoutStatus = sessions?.[0]?.status;

  return (
    <>
      <header>
        <p className="text-sm font-semibold text-emerald-600">
          NUTRITION ASSISTANT
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Food recommendations
        </h1>
        <p className="mt-2 text-slate-500">
          Check how a food fits into your remaining calorie budget.
        </p>
      </header>
      <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
        {dailyGoal === null
          ? "Set your daily calorie target in Profile to receive personalized budget guidance."
          : `${caloriesLogged} kcal logged today · ${remaining} kcal remaining from your ${dailyGoal} kcal goal.`}
      </div>
      {plans && !plans.is_rest_day ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-950">
          <p>
            Today&apos;s workout is{" "}
            {workoutStatus === "completed"
              ? "completed"
              : workoutStatus === "in_progress"
                ? "in progress"
                : "planned"}
            . Your food budget remains based on your intake goal.
          </p>
          <Link className="font-semibold text-sky-800" href="/exercises">
            View workout →
          </Link>
        </div>
      ) : plans?.is_rest_day ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Today is a planned rest day. Your food budget remains based on your
          intake goal.
        </div>
      ) : null}
      <FoodRecommendation
        caloriesLogged={caloriesLogged}
        dailyGoal={dailyGoal}
      />
    </>
  );
}
