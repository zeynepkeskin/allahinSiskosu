import { ExercisePlanner } from "@/components/exercise-planner";
import type { ExercisePlan } from "@/lib/exercises";
import { createClient } from "@/lib/supabase/server";
import { dayOfWeek, todayInTimeZone } from "@/lib/timezone";
import { userTimeZone } from "@/lib/timezone-server";

export default async function ExercisesPage() {
  const supabase = await createClient();
  const timeZone = await userTimeZone();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("exercise_plans")
    .select(
      "id, day_of_week, is_rest_day, plan_exercises(id, name, sets, reps, weight_lb, rest_seconds, sort_order)",
    )
    .eq("profile_id", user!.id);
  const { data: sessionData } = await supabase
    .from("workout_sessions")
    .select("id, status, started_at")
    .eq("profile_id", user!.id)
    .order("started_at", { ascending: false })
    .limit(8);
  const plans: ExercisePlan[] = (data ?? []).map((plan) => ({
    id: plan.id,
    dayOfWeek: plan.day_of_week,
    isRestDay: plan.is_rest_day,
    exercises: (plan.plan_exercises ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        weightLb:
          exercise.weight_lb === null ? null : Number(exercise.weight_lb),
        restSeconds: exercise.rest_seconds,
      })),
  }));
  return (
    <>
      <header>
        <p className="text-sm font-semibold text-emerald-600">TRAINING</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Exercises</h1>
        <p className="mt-2 text-slate-500">
          Plan each day of your week, then start a guided strength workout.
        </p>
      </header>
      <ExercisePlanner
        initialActiveDay={dayOfWeek(todayInTimeZone(timeZone))}
        initialPlans={plans}
        sessions={(sessionData ?? []).map((session) => ({
          id: session.id,
          status: session.status,
          startedAt: session.started_at,
        }))}
      />
    </>
  );
}
