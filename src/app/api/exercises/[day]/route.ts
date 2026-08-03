import { NextResponse } from "next/server";
import { z } from "zod";
import { planSchema } from "@/lib/exercises";
import { createClient } from "@/lib/supabase/server";

const timingUpdateSchema = z
  .object({
    planId: z.string().uuid(),
    exerciseId: z.string().uuid(),
    timer: z.enum(["set", "rest"]),
    seconds: z.number().int().min(0),
  })
  .superRefine((value, context) => {
    const maximum = value.timer === "set" ? 7200 : 1800;
    const minimum = value.timer === "set" ? 1 : 0;
    if (value.seconds < minimum || value.seconds > maximum)
      context.addIssue({
        code: "custom",
        message: `Enter between ${minimum} and ${maximum} seconds.`,
        path: ["seconds"],
      });
  });

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
    const { error } = await supabase.from("plan_exercises").insert(
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ day: string }> },
) {
  const day = dayFrom(await params);
  const parsed = timingUpdateSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (day === null || !parsed.success)
    return NextResponse.json(
      { error: "Enter a valid timer duration." },
      { status: 400 },
    );
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to update exercises." },
      { status: 401 },
    );
  const column =
    parsed.data.timer === "set" ? "set_duration_seconds" : "rest_seconds";
  const { error } = await supabase
    .from("plan_exercises")
    .update({ [column]: parsed.data.seconds })
    .eq("id", parsed.data.exerciseId)
    .eq("exercise_plan_id", parsed.data.planId);
  if (error)
    return NextResponse.json(
      { error: "Could not update the exercise plan." },
      { status: 500 },
    );
  return NextResponse.json({ ok: true });
}
