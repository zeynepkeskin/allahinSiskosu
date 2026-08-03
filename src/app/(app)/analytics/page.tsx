import Link from "next/link";
import { Card, EmptyState } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import {
  addCalendarDays,
  formatInTimeZone,
  dateKeyInTimeZone,
  startOfDayInTimeZone,
  todayInTimeZone,
} from "@/lib/timezone";
import { userTimeZone } from "@/lib/timezone-server";
import {
  calculateWorkoutMetrics,
  completedWorkoutSessions,
  countPlannedWorkoutDays,
  type WorkoutSessionRow,
} from "@/lib/workout-metrics";

type MealRow = {
  id: string;
  meal_time: string;
  total_calories: number | string;
  protein: number | string;
  carbs: number | string;
  fat: number | string;
};
type DailyTotal = {
  date: string;
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};
const number = (value: number | string) => Number(value) || 0;
const shortDate = (date: string, timeZone: string) =>
  formatInTimeZone(startOfDayInTimeZone(date, timeZone), {
    month: "short",
    day: "numeric",
  }, timeZone);
const average = (values: number[]) =>
  values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : null;

function buildDailyTotals(meals: MealRow[], start: string, timeZone: string): DailyTotal[] {
  return Array.from({ length: 30 }, (_, index) => {
    const date = addCalendarDays(start, index);
    const total = meals
      .filter((meal) => dateKeyInTimeZone(meal.meal_time, timeZone) === date)
      .reduce(
        (sum, meal) => ({
          calories: sum.calories + number(meal.total_calories),
          protein: sum.protein + number(meal.protein),
          carbs: sum.carbs + number(meal.carbs),
          fat: sum.fat + number(meal.fat),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      );
    return { date, label: shortDate(date, timeZone), ...total };
  });
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const timeZone = await userTimeZone();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const today = todayInTimeZone(timeZone);
  const monthStart = addCalendarDays(today, -29);
  const [
    { data: profile },
    { data: mealData },
    { data: sessionData },
    { data: plans },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("daily_calorie_goal")
      .eq("id", user!.id)
      .maybeSingle(),
    supabase
      .from("meals")
      .select("id, meal_time, total_calories, protein, carbs, fat")
      .eq("profile_id", user!.id)
      .gte("meal_time", startOfDayInTimeZone(monthStart, timeZone).toISOString())
      .order("meal_time", { ascending: true }),
    supabase
      .from("workout_sessions")
      .select(
        "id, status, started_at, completed_at, workout_session_exercises(planned_sets, planned_reps, completed_sets, weight_lb)",
      )
      .eq("profile_id", user!.id)
      .gte("started_at", startOfDayInTimeZone(monthStart, timeZone).toISOString())
      .order("started_at", { ascending: true }),
    supabase
      .from("exercise_plans")
      .select("day_of_week, is_rest_day")
      .eq("profile_id", user!.id),
  ]);
  const meals = (mealData ?? []) as MealRow[];
  const sessions = (sessionData ?? []) as WorkoutSessionRow[];
  const completedSessions = completedWorkoutSessions(sessions);
  const monthlyTraining = calculateWorkoutMetrics(sessions, timeZone);
  const weeklyTraining = calculateWorkoutMetrics(
    sessions.filter(
      (session) => dateKeyInTimeZone(session.started_at, timeZone) >= addCalendarDays(today, -6),
    ),
    timeZone,
  );
  const plannedDays = countPlannedWorkoutDays(
    plans ?? [],
    startOfDayInTimeZone(monthStart, timeZone),
    30,
    timeZone,
  );
  const weeklyPlannedDays = countPlannedWorkoutDays(
    plans ?? [],
    startOfDayInTimeZone(addCalendarDays(today, -6), timeZone),
    7,
    timeZone,
  );
  const daily = buildDailyTotals(meals, monthStart, timeZone);
  const weekly = daily.slice(-7);
  const weeklyWorkoutDays = weekly.map((day) => ({
    ...day,
    workouts: completedSessions.filter(
      (session) => dateKeyInTimeZone(session.started_at, timeZone) === day.date,
    ).length,
  }));
  const loggedDays = daily.filter((day) => day.calories > 0);
  const weekLoggedDays = weekly.filter((day) => day.calories > 0);
  const goal = profile?.daily_calorie_goal
    ? Number(profile.daily_calorie_goal)
    : null;
  const todayTotal = daily.at(-1)!;
  const weeklyAverage = average(weekLoggedDays.map((day) => day.calories));
  const monthlyAverage = average(loggedDays.map((day) => day.calories));
  const highest = loggedDays.length
    ? loggedDays.reduce((best, day) =>
        day.calories > best.calories ? day : best,
      )
    : null;
  const lowest = loggedDays.length
    ? loggedDays.reduce((best, day) =>
        day.calories < best.calories ? day : best,
      )
    : null;
  const adherence =
    goal && loggedDays.length
      ? Math.round(
          (loggedDays.filter((day) => day.calories <= goal).length /
            loggedDays.length) *
            100,
        )
      : null;
  const macros = loggedDays.reduce(
    (sum, day) => ({
      protein: sum.protein + day.protein,
      carbs: sum.carbs + day.carbs,
      fat: sum.fat + day.fat,
    }),
    { protein: 0, carbs: 0, fat: 0 },
  );
  const macroCalories = {
    protein: macros.protein * 4,
    carbs: macros.carbs * 4,
    fat: macros.fat * 9,
  };
  const macroCalorieTotal =
    macroCalories.protein + macroCalories.carbs + macroCalories.fat;
  const percentage = (value: number) =>
    macroCalorieTotal ? Math.round((value / macroCalorieTotal) * 100) : 0;
  const proteinPercent = percentage(macroCalories.protein),
    carbsPercent = percentage(macroCalories.carbs),
    fatPercent = percentage(macroCalories.fat);
  const chartMax = Math.max(goal ?? 0, ...weekly.map((day) => day.calories), 1);
  const linePoints = weekly
    .map(
      (day, index) =>
        `${(index / 6) * 100},${100 - (day.calories / chartMax) * 86 - 7}`,
    )
    .join(" ");

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-emerald-600">INSIGHTS</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Health analytics
          </h1>
          <p className="mt-2 text-slate-500">
            Your nutrition and completed strength workouts over the last 30
            days.
          </p>
        </div>
        <Link
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          href="/meals"
        >
          + Add eat
        </Link>
      </header>
      {meals.length === 0 && completedSessions.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No health data yet"
            description="Log an eat or complete a workout to unlock your insights."
            action={
              <Link
                className="text-sm font-semibold text-emerald-700"
                href="/meals"
              >
                Log an eat →
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Stat
              label="Today"
              value={`${todayTotal.calories} kcal`}
              hint={
                goal
                  ? `${Math.max(goal - todayTotal.calories, 0)} kcal remaining`
                  : "Set a calorie goal"
              }
            />
            <Stat
              label="Weekly average"
              value={`${weeklyAverage ?? 0} kcal`}
              hint="Across logged days"
            />
            <Stat
              label="Monthly average"
              value={`${monthlyAverage ?? 0} kcal`}
              hint="Last 30 days"
            />
            <Stat
              label="Goal adherence"
              value={adherence === null ? "—" : `${adherence}%`}
              hint={
                goal ? "Logged days at or below goal" : "Set a calorie goal"
              }
            />
            <Stat
              label="Workouts this week"
              value={`${weeklyTraining.completedWorkouts}`}
              hint={
                weeklyPlannedDays
                  ? `${weeklyTraining.workoutDays} of ${weeklyPlannedDays} planned days`
                  : "No training days planned"
              }
            />
          </div>
          <div className="mt-7 grid gap-6 xl:grid-cols-5">
            <Card className="xl:col-span-3">
              <h2 className="font-semibold">Weekly calorie trend</h2>
              <p className="mt-1 text-sm text-slate-500">
                Calories logged over the last seven days.
              </p>
              <div className="mt-6 h-48">
                <svg
                  aria-label="Seven day calorie line chart"
                  className="h-full w-full overflow-visible"
                  preserveAspectRatio="none"
                  role="img"
                  viewBox="0 0 100 100"
                >
                  <line
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    x1="0"
                    x2="100"
                    y1="93"
                    y2="93"
                  />
                  {goal ? (
                    <line
                      stroke="#f59e0b"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                      x1="0"
                      x2="100"
                      y1={100 - (goal / chartMax) * 86 - 7}
                      y2={100 - (goal / chartMax) * 86 - 7}
                    />
                  ) : null}
                  <polyline
                    fill="none"
                    points={linePoints}
                    stroke="#10b981"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                {weekly.map((day) => (
                  <span key={day.label}>{day.label}</span>
                ))}
              </div>
              {goal ? (
                <p className="mt-4 text-xs text-amber-700">
                  Dashed line: {goal} kcal goal
                </p>
              ) : null}
            </Card>
            <Card className="xl:col-span-2">
              <h2 className="font-semibold">Macro split</h2>
              <p className="mt-1 text-sm text-slate-500">
                Share of logged macro calories.
              </p>
              <div className="mt-6 flex items-center gap-6">
                <div
                  aria-label="Macro calorie distribution"
                  className="h-32 w-32 shrink-0 rounded-full"
                  style={{
                    background: `conic-gradient(#10b981 0 ${proteinPercent}%, #38bdf8 ${proteinPercent}% ${proteinPercent + carbsPercent}%, #f59e0b ${proteinPercent + carbsPercent}% 100%)`,
                  }}
                />
                <div className="space-y-3 text-sm">
                  <Macro
                    label="Protein"
                    value={macros.protein}
                    percent={proteinPercent}
                    color="bg-emerald-500"
                  />
                  <Macro
                    label="Carbs"
                    value={macros.carbs}
                    percent={carbsPercent}
                    color="bg-sky-400"
                  />
                  <Macro
                    label="Fat"
                    value={macros.fat}
                    percent={fatPercent}
                    color="bg-amber-500"
                  />
                </div>
              </div>
            </Card>
          </div>
          <Card className="mt-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-semibold">Weekly workout completion</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Completed strength workouts over the last seven days.
                </p>
              </div>
              <p className="text-sm font-semibold text-emerald-700">
                {weeklyTraining.completedWorkouts} completed
              </p>
            </div>
            <div className="mt-5 grid grid-cols-7 gap-2">
              {weeklyWorkoutDays.map((day) => (
                <div
                  className="rounded-xl bg-slate-50 p-3 text-center"
                  key={day.label}
                >
                  <p className="text-xs text-slate-500">{day.label}</p>
                  <p
                    className={
                      day.workouts
                        ? "mt-2 text-lg font-bold text-emerald-700"
                        : "mt-2 text-lg font-bold text-slate-400"
                    }
                  >
                    {day.workouts ? "✓" : "—"}
                  </p>
                  <p className="text-xs text-slate-500">{day.workouts || 0}</p>
                </div>
              ))}
            </div>
          </Card>
          <div className="mt-7 grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="font-semibold">Macro trends</h2>
              <p className="mt-1 text-sm text-slate-500">
                Daily averages from your logged days.
              </p>
              <div className="mt-6 space-y-5">
                <Trend
                  label="Protein"
                  value={average(loggedDays.map((day) => day.protein)) ?? 0}
                  color="bg-emerald-500"
                  maximum={Math.max(...loggedDays.map((day) => day.protein), 1)}
                />
                <Trend
                  label="Carbs"
                  value={average(loggedDays.map((day) => day.carbs)) ?? 0}
                  color="bg-sky-400"
                  maximum={Math.max(...loggedDays.map((day) => day.carbs), 1)}
                />
                <Trend
                  label="Fat"
                  value={average(loggedDays.map((day) => day.fat)) ?? 0}
                  color="bg-amber-500"
                  maximum={Math.max(...loggedDays.map((day) => day.fat), 1)}
                />
              </div>
            </Card>
            <Card>
              <h2 className="font-semibold">30-day highlights</h2>
              <p className="mt-1 text-sm text-slate-500">
                Your calorie range across logged days.
              </p>
              <dl className="mt-6 divide-y divide-slate-100">
                <Highlight label="Highest calorie day" day={highest} />
                <Highlight label="Lowest calorie day" day={lowest} />
                <div className="flex items-center justify-between py-4">
                  <dt className="text-sm text-slate-600">Days logged</dt>
                  <dd className="font-semibold">{loggedDays.length} of 30</dd>
                </div>
              </dl>
            </Card>
            <Card>
              <h2 className="font-semibold">Training summary</h2>
              <p className="mt-1 text-sm text-slate-500">
                Completed strength workouts from the last 30 days.
              </p>
              <dl className="mt-6 divide-y divide-slate-100">
                <TrainingRow
                  label="Completed workouts"
                  value={`${monthlyTraining.completedWorkouts}`}
                />
                <TrainingRow
                  label="Training consistency"
                  value={
                    plannedDays
                      ? `${Math.round((monthlyTraining.workoutDays / plannedDays) * 100)}%`
                      : "—"
                  }
                  hint={
                    plannedDays
                      ? `${monthlyTraining.workoutDays} of ${plannedDays} planned days`
                      : "Plan workouts to track consistency"
                  }
                />
                <TrainingRow
                  label="Completed sets"
                  value={`${monthlyTraining.completedSets}`}
                />
                <TrainingRow
                  label="Completed reps"
                  value={`${monthlyTraining.completedReps}`}
                />
                <TrainingRow
                  label="Loaded volume"
                  value={`${monthlyTraining.loadedVolume.toLocaleString()} lb`}
                />
                <TrainingRow
                  label="Average duration"
                  value={
                    monthlyTraining.averageDurationMinutes === null
                      ? "—"
                      : `${monthlyTraining.averageDurationMinutes} min`
                  }
                />
              </dl>
            </Card>
          </div>
        </>
      )}
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
function Macro({
  label,
  value,
  percent,
  color,
}: {
  label: string;
  value: number;
  percent: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold">{Math.round(value)}g</span>
      <span className="text-slate-400">{percent}%</span>
    </div>
  );
}
function Trend({
  label,
  value,
  color,
  maximum,
}: {
  label: string;
  value: number;
  color: string;
  maximum: number;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{value}g avg</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(100, (value / maximum) * 100)}%` }}
        />
      </div>
    </div>
  );
}
function Highlight({ label, day }: { label: string; day: DailyTotal | null }) {
  return (
    <div className="flex items-center justify-between py-4">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className="text-right">
        <span className="font-semibold">{day?.calories ?? 0} kcal</span>
        {day ? (
          <span className="ml-2 text-xs text-slate-400">{day.label}</span>
        ) : null}
      </dd>
    </div>
  );
}

function TrainingRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-sm text-slate-600">
        {label}
        {hint ? (
          <span className="mt-0.5 block text-xs text-slate-400">{hint}</span>
        ) : null}
      </dt>
      <dd className="shrink-0 font-semibold">{value}</dd>
    </div>
  );
}
