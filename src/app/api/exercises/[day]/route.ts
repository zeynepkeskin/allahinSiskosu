import { NextResponse } from "next/server";
import { planSchema } from "@/lib/exercises";
import { createClient } from "@/lib/supabase/server";

function dayFrom(params: { day: string }) {
  const day = Number(params.day);
  return Number.isInteger(day) && day >= 0 && day <= 6 ? day : null;
}
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ day: string }> },
) {
  const day = dayFrom(await params);
  const parsed = planSchema.safeParse(await request.json().catch(() => null));
  if (day === null || !parsed.success)
    return NextResponse.json(
      { error: "Enter a valid exercise plan." },
      { status: 400 },
    );
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to manage exercises." },
      { status: 401 },
    );
  const { data: plan, error: planError } = await supabase
    .from("exercise_plans")
    .upsert(
      {
        profile_id: user.id,
        day_of_week: day,
        is_rest_day: parsed.data.isRestDay,
      },
      { onConflict: "profile_id,day_of_week" },
    )
    .select("id, day_of_week, is_rest_day")
    .single();
  if (planError || !plan)
    return NextResponse.json(
      { error: "Could not save the exercise plan." },
      { status: 500 },
    );
  const { error: deleteError } = await supabase
    .from("plan_exercises")
    .delete()
    .eq("exercise_plan_id", plan.id);
  if (deleteError)
    return NextResponse.json(
      { error: "Could not update exercises." },
      { status: 500 },
    );
  if (parsed.data.exercises.length) {
    const { error } = await supabase
      .from("plan_exercises")
      .insert(
        parsed.data.exercises.map((exercise, sortOrder) => ({
          exercise_plan_id: plan.id,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight_lb: exercise.weightLb,
          rest_seconds: exercise.restSeconds,
          set_duration_seconds: exercise.setDurationSeconds,
          sort_order: sortOrder,
        })),
      );
    if (error)
      return NextResponse.json(
        { error: "Could not save exercises." },
        { status: 500 },
      );
  }
  return NextResponse.json({
    id: plan.id,
    dayOfWeek: plan.day_of_week,
    isRestDay: plan.is_rest_day,
    exercises: parsed.data.exercises,
  });
}
