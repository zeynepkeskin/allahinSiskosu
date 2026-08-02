import { WeightTracker, type WeightEntry } from "@/components/weight-tracker";
import { Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { kilogramsToPounds } from "@/lib/units";
import {
  addCalendarDays,
  formatInTimeZone,
  startOfDayInTimeZone,
  todayInTimeZone,
} from "@/lib/timezone";
import { userTimeZone } from "@/lib/timezone-server";
import {
  calculateWorkoutMetrics,
  completedWorkoutSessions,
  type WorkoutSessionRow,
} from "@/lib/workout-metrics";

export default async function ProgressPage() {
  const supabase = await createClient();
  const timeZone = await userTimeZone();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const weekAgo = startOfDayInTimeZone(addCalendarDays(todayInTimeZone(timeZone), -6), timeZone);
  const [{ data }, { data: sessionData }] = await Promise.all([
    supabase
      .from("daily_weights")
      .select("id, weight, date")
      .eq("profile_id", user!.id)
      .order("date", { ascending: false }),
    supabase
      .from("workout_sessions")
      .select(
        "id, status, started_at, completed_at, workout_session_exercises(planned_sets, planned_reps, completed_sets, weight_lb)",
      )
      .eq("profile_id", user!.id)
      .gte("started_at", weekAgo.toISOString())
      .order("started_at", { ascending: false }),
  ]);
  const entries: WeightEntry[] = (data ?? []).map((entry) => ({
    id: entry.id,
    weight: kilogramsToPounds(Number(entry.weight)),
    date: entry.date,
  }));
  const sessions = (sessionData ?? []) as WorkoutSessionRow[];
  const metrics = calculateWorkoutMetrics(sessions, timeZone);
  const latest = completedWorkoutSessions(sessions)[0];
  return (
    <>
      <header>
        <p className="text-sm font-semibold text-emerald-600">INSIGHTS</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Your progress
        </h1>
        <p className="mt-2 text-slate-500">
          Track your weight with recent training context.
        </p>
      </header>
      <Card className="mt-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-semibold">Training this week</h2>
            <p className="mt-1 text-sm text-slate-500">
              Workout context can help you read your weight trend; it does not
              prove cause and effect.
            </p>
          </div>
          <p className="text-2xl font-bold text-emerald-700">
            {metrics.completedWorkouts} workouts
          </p>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Metric label="Completed sets" value={`${metrics.completedSets}`} />
          <Metric
            label="Loaded volume"
            value={`${metrics.loadedVolume.toLocaleString()} lb`}
          />
          <Metric
            label="Latest workout"
            value={
              latest
                ? formatInTimeZone(latest.started_at, {
                    month: "short",
                    day: "numeric",
                  }, timeZone)
                : "None yet"
            }
          />
        </div>
      </Card>
      <WeightTracker initialEntries={entries} />
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
