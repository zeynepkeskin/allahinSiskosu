import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to view exercises." },
      { status: 401 },
    );
  const { data, error } = await supabase
    .from("exercise_plans")
    .select(
      "id, day_of_week, is_rest_day, plan_exercises(id, name, sets, reps, weight_lb, rest_seconds, sort_order)",
    )
    .eq("profile_id", user.id)
    .order("day_of_week");
  if (error)
    return NextResponse.json(
      { error: "Could not load exercise plans." },
      { status: 500 },
    );
  return NextResponse.json(
    (data ?? []).map((plan) => ({
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
    })),
  );
}
