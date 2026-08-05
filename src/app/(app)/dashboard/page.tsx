import Link from "next/link";
import { Card, EmptyState, ProgressBar } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import {
  addCalendarDays,
  formatInTimeZone,
  dateKeyInTimeZone,
  dayOfWeek,
  startOfDayInTimeZone,
  todayInTimeZone,
} from "@/lib/timezone";
import { userTimeZone } from "@/lib/timezone-server";
import {
  calculateWorkoutMetrics,
  calendarDateKey,
  completedWorkoutSessions,
  countPlannedWorkoutDays,
  type WorkoutSessionRow,
} from "@/lib/workout-metrics";

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

function dayLabel(dateKey: string, timeZone: string) {
  return formatInTimeZone(
    startOfDayInTimeZone(dateKey, timeZone),
    {
      weekday: "short",
    },
    timeZone,
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const timeZone = await userTimeZone();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = todayInTimeZone(timeZone);
  const weekStart = addCalendarDays(today, -6);

  const [
    { data: profile },
    { data: meals },
    { data: sessions },
    { data: plans },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("daily_calorie_goal")
      .eq("id", user!.id)
      .maybeSingle(),
    supabase
      .from("meals")
      .select("id, meal_name, meal_time, total_calories, protein, carbs, fat")
      .eq("profile_id", user!.id)
      .gte("meal_time", startOfDayInTimeZone(weekStart, timeZone).toISOString())
      .order("meal_time", { ascending: false }),
    supabase
      .from("workout_sessions")
      .select("id, status, started_at, completed_at, exercises")
      .gte(
        "started_at",
        startOfDayInTimeZone(weekStart, timeZone).toISOString(),
      )
      .order("started_at", { ascending: false }),
    supabase
      .from("exercise_plans")
      .select("id, day_of_week, is_rest_day")
      .eq("profile_id", user!.id),
  ]);

  const recentMeals = (meals ?? []) as MealRow[];
  const workoutSessions = (sessions ?? []) as WorkoutSessionRow[];
  const completedWorkouts = completedWorkoutSessions(workoutSessions);
  const weeklyWorkoutMetrics = calculateWorkoutMetrics(
    workoutSessions,
    timeZone,
  );
  const todayPlan = (plans ?? []).find(
    (plan) => plan.day_of_week === dayOfWeek(today),
  );
  const todaySession = workoutSessions.find(
    (session) => calendarDateKey(session.started_at, timeZone) === today,
  );
  const plannedDays = countPlannedWorkoutDays(
    plans ?? [],
    startOfDayInTimeZone(weekStart, timeZone),
    7,
    timeZone,
  );
  const todayMeals = recentMeals.filter(
    (meal) => dateKeyInTimeZone(meal.meal_time, timeZone) === today,
  );
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
    const date = addCalendarDays(weekStart, index);
    return {
      label: dayLabel(date, timeZone),
      date,
      calories: recentMeals
        .filter((meal) => {
          return dateKeyInTimeZone(meal.meal_time, timeZone) === date;
        })
        .reduce((sum, meal) => sum + number(meal.total_calories), 0),
      workouts: completedWorkouts.filter(
        (session) => calendarDateKey(session.started_at, timeZone) === date,
      ).length,
    };
  });
  const loggedDays = dailyCalories.filter((day) => day.calories > 0);
  const weeklyAverage = loggedDays.length
    ? Math.round(
        loggedDays.reduce((sum, day) => sum + day.calories, 0) /
          loggedDays.length,
      )
    : null;
  const chartMaximum =
    Math.max(goal ?? 0, ...dailyCalories.map((day) => day.calories), 1) * 1.1;

  const workoutLabel = todayPlan?.is_rest_day
    ? "Rest day"
    : todaySession?.status === "completed"
      ? "Completed"
      : todaySession?.status === "in_progress"
        ? "In progress"
        : todayPlan
          ? "Planned"
          : "No workout planned";
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
          + Add eat
        </Link>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-5">
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
        <div className="hidden sm:block">
          <Stat
            label="Weekly average"
            value={weeklyAverage === null ? "—" : `${weeklyAverage} kcal`}
            hint={
              weeklyAverage === null
                ? "No eats logged this week"
                : "Across logged days"
            }
          />
        </div>
        <Stat
          label="Training this week"
          value={`${weeklyWorkoutMetrics.completedWorkouts} workouts`}
          hint={
            plannedDays
              ? `${weeklyWorkoutMetrics.workoutDays} of ${plannedDays} planned days`
              : "No training days planned"
          }
        />
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <h2 className="font-semibold">Daily progress</h2>
          <p className="mt-1 text-sm text-slate-500">
            Macros logged with today&apos;s eats.
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
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">This week</h2>
              <p className="mt-1 text-sm text-slate-500">
                Calories and completed workouts.
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {weeklyWorkoutMetrics.completedSets} sets
            </span>
          </div>
          <div
            aria-label="Calories and completed workouts over the last seven days"
            className="mt-8"
          >
            <div className="relative flex h-28 items-end gap-2">
              {goal !== null ? (
                <div
                  aria-label={`Daily calorie limit: ${goal} kcal`}
                  className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-dashed border-amber-500"
                  style={{ bottom: `${(goal / chartMaximum) * 100}%` }}
                  title={`Daily calorie limit: ${goal} kcal`}
                >
                  <span className="absolute -top-5 right-0 text-[10px] font-semibold text-amber-700">
                    {goal} kcal limit
                  </span>
                </div>
              ) : null}
              {dailyCalories.map((day) => (
                <div
                  className="flex h-full flex-1 items-end gap-0.5"
                  key={day.date}
                  title={`${day.label}: ${day.calories} kcal, ${day.workouts} workouts`}
                >
                  <div
                    className="min-h-1 flex-1 rounded-t-md bg-emerald-500"
                    style={{
                      height: `${(day.calories / chartMaximum) * 100}%`,
                    }}
                  />
                  <div
                    className="min-h-1 flex-1 rounded-t-md bg-sky-400"
                    style={{
                      height: `${day.workouts ? 30 + day.workouts * 35 : 0}%`,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              {dailyCalories.map((day) => (
                <span
                  className="flex-1 text-center text-xs text-slate-500"
                  key={day.date}
                >
                  {day.label}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-5 text-sm text-slate-500">
            {weeklyAverage === null
              ? "Log eats to see your calorie trend."
              : `Average: ${weeklyAverage} kcal per logged day.`}{" "}
            Blue bars show completed workouts.
          </p>
        </Card>
      </div>

      <section className="mt-7">
        <Card className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-600">
              TODAY&apos;S TRAINING
            </p>
            <h2 className="mt-1 text-xl font-bold">{workoutLabel}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {todayPlan?.is_rest_day
                ? "Recovery is part of your training plan."
                : todayPlan
                  ? "Your planned workout is ready when you are."
                  : "Plan a strength workout for a future training day."}
            </p>
          </div>
          <Link
            className="rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            href="/exercises"
          >
            {todayPlan && !todayPlan.is_rest_day
              ? "View workout"
              : "Plan workout"}
          </Link>
        </Card>
      </section>

      <section className="mt-7">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-semibold">Today&apos;s eats</h2>
            <p className="mt-1 text-sm text-slate-500">
              Your most recently logged eats appear first.
            </p>
          </div>
          {todayMeals.length ? (
            <Link
              className="text-sm font-semibold text-emerald-700"
              href="/meals"
            >
              View all eats →
            </Link>
          ) : null}
        </div>
        {todayMeals.length === 0 ? (
          <EmptyState
            title="No eats logged today"
            description="Tell us what you ate and review the nutrition estimate before saving it."
            action={
              <Link
                className="text-sm font-semibold text-emerald-700"
                href="/meals"
              >
                Log your first eat →
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
                      {formatInTimeZone(
                        meal.meal_time,
                        {
                          hour: "numeric",
                          minute: "2-digit",
                        },
                        timeZone,
                      )}
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
