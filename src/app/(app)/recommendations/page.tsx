import { FoodRecommendation } from "@/components/food-recommendation";
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
  const [{ data: profile }, { data: meals }] = await Promise.all([
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
  ]);
  const caloriesLogged = (meals ?? []).reduce(
    (total, meal) => total + (Number(meal.total_calories) || 0),
    0,
  );
  const dailyGoal = profile?.daily_calorie_goal ?? null;
  const remaining =
    dailyGoal === null ? null : Math.max(dailyGoal - caloriesLogged, 0);

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
      <FoodRecommendation
        caloriesLogged={caloriesLogged}
        dailyGoal={dailyGoal}
      />
    </>
  );
}
