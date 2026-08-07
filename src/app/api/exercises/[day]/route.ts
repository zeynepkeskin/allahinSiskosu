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
        exercises: parsed.data.exercises.map((exercise, sortOrder) => ({
          id: exercise.id ?? crypto.randomUUID(),
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight_lb: exercise.weightLb,
          rest_seconds: exercise.restSeconds,
          set_duration_seconds: exercise.setDurationSeconds,
          sort_order: sortOrder,
        })),
      },
      { onConflict: "profile_id,day_of_week" },
    )
    .select("id, day_of_week, is_rest_day, exercises")
    .single();
  if (planError || !plan)
    return NextResponse.json(
      { error: "Could not save the exercise plan." },
      { status: 500 },
    );
  return NextResponse.json({
    id: plan.id,
    dayOfWeek: plan.day_of_week,
    isRestDay: plan.is_rest_day,
    exercises: ((plan.exercises ?? []) as Array<Record<string, unknown>>).map(
      (exercise) => ({
        id: String(exercise.id),
        name: String(exercise.name),
        sets: Number(exercise.sets),
        reps: Number(exercise.reps),
        weightLb:
          exercise.weight_lb === null ? null : Number(exercise.weight_lb),
        restSeconds: Number(exercise.rest_seconds),
        setDurationSeconds:
          exercise.set_duration_seconds === null
            ? null
            : Number(exercise.set_duration_seconds),
      }),
    ),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ day: string }> },
) {
  const day = dayFrom(await params);
  if (day === null)
    return NextResponse.json({ error: "Enter a valid day." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to manage exercises." },
      { status: 401 },
    );

  const { error } = await supabase
    .from("exercise_plans")
    .delete()
    .eq("profile_id", user.id)
    .eq("day_of_week", day);
  if (error)
    return NextResponse.json(
      { error: "Could not delete the exercise plan." },
      { status: 500 },
    );

  return NextResponse.json({ ok: true });
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
  const { data: plan, error: fetchError } = await supabase
    .from("exercise_plans")
    .select("exercises")
    .eq("id", parsed.data.planId)
    .eq("profile_id", user.id)
    .single();
  const key =
    parsed.data.timer === "set" ? "set_duration_seconds" : "rest_seconds";
  const exercises = (
    (plan?.exercises ?? []) as Array<Record<string, unknown>>
  ).map((exercise) =>
    String(exercise.id) === parsed.data.exerciseId
      ? { ...exercise, [key]: parsed.data.seconds }
      : exercise,
  );
  if (
    fetchError ||
    !plan ||
    !exercises.some(
      (exercise) => String(exercise.id) === parsed.data.exerciseId,
    )
  )
    return NextResponse.json(
      { error: "Could not update the exercise plan." },
      { status: 500 },
    );
  const { error } = await supabase
    .from("exercise_plans")
    .update({ exercises })
    .eq("id", parsed.data.planId)
    .eq("profile_id", user.id);
  if (error)
    return NextResponse.json(
      { error: "Could not update the exercise plan." },
      { status: 500 },
    );
  return NextResponse.json({ ok: true });
}
