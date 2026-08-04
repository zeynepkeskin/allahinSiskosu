import { notFound, redirect } from "next/navigation";
import { WorkoutRunner } from "@/components/workout-runner";
import { exercisePlanFromRow, type ExercisePlan } from "@/lib/exercises";
import { createClient } from "@/lib/supabase/server";

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const day = Number((await params).day);
  if (!Number.isInteger(day) || day < 0 || day > 6) notFound();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("exercise_plans")
    .select("id, day_of_week, is_rest_day, exercises")
    .eq("profile_id", user!.id)
    .eq("day_of_week", day)
    .single();
  if (!data || data.is_rest_day || !(data.exercises ?? []).length)
    redirect("/exercises");
  const plan: ExercisePlan = exercisePlanFromRow(data);
  return <WorkoutRunner plan={plan} />;
}
