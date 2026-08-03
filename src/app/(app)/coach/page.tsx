import { CoachPanels } from "@/components/coach-panels";
import { createClient } from "@/lib/supabase/server";
import { startOfDayInTimeZone, todayInTimeZone } from "@/lib/timezone";
import { userTimeZone } from "@/lib/timezone-server";

export default async function CoachPage() {
  const supabase = await createClient();
  const timeZone = await userTimeZone();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const today = todayInTimeZone(timeZone);
  const todayStart = startOfDayInTimeZone(today, timeZone);
  const [{ data: profile }, { data: meals }] = await Promise.all([
    supabase
      .from("profiles")
      .select("daily_calorie_goal")
      .eq("id", user!.id)
      .maybeSingle(),
    supabase
      .from("meals")
      .select("total_calories, protein, carbs, fat")
      .eq("profile_id", user!.id)
      .gte("meal_time", todayStart.toISOString()),
  ]);
  const caloriesLogged = (meals ?? []).reduce(
    (total, meal) => total + (Number(meal.total_calories) || 0),
    0,
  );
  const dailyGoal = profile?.daily_calorie_goal ?? null;
  const nutritionLogged = (meals ?? []).reduce(
    (total, meal) => ({
      protein: total.protein + (Number(meal.protein) || 0),
      carbs: total.carbs + (Number(meal.carbs) || 0),
      fat: total.fat + (Number(meal.fat) || 0),
    }),
    { protein: 0, carbs: 0, fat: 0 },
  );

  return (
    <>
      <header>
        <p className="text-sm font-semibold text-emerald-600">AI COACH</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Make your nutrition and training work together
        </h1>
        <p className="mt-2 text-slate-500">
          A supportive look at your eats and completed strength workouts.
        </p>
      </header>
      <CoachPanels
        caloriesLogged={caloriesLogged}
        dailyGoal={dailyGoal}
        nutritionLogged={nutritionLogged}
      />
    </>
  );
}
