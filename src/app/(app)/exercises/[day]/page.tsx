import { notFound, redirect } from "next/navigation";
import { WorkoutRunner } from "@/components/workout-runner";
import type { ExercisePlan } from "@/lib/exercises";
import { createClient } from "@/lib/supabase/server";

export default async function WorkoutPage({ params }: { params: Promise<{ day: string }> }) {
  const day = Number((await params).day); if (!Number.isInteger(day) || day < 0 || day > 6) notFound();
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.from("exercise_plans").select("id, day_of_week, is_rest_day, plan_exercises(id, name, sets, reps, weight_lb, weight_display, rest_seconds, sort_order)").eq("profile_id", user!.id).eq("day_of_week", day).single();
  if (!data || data.is_rest_day || !data.plan_exercises.length) redirect("/exercises");
  const plan: ExercisePlan = { id: data.id, dayOfWeek: data.day_of_week, isRestDay: data.is_rest_day, exercises: [...data.plan_exercises].sort((a, b) => a.sort_order - b.sort_order).map((exercise) => ({ id: exercise.id, name: exercise.name, sets: exercise.sets, reps: exercise.reps, weightLb: exercise.weight_lb === null ? null : Number(exercise.weight_lb), weightDisplay: exercise.weight_display ?? "", restSeconds: exercise.rest_seconds })) };
  return <WorkoutRunner plan={plan} />;
}
