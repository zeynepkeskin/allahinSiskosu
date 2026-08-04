import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const startSchema = z.object({ planId: z.string().uuid() });
export async function POST(request: Request) {
  const parsed = startSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid workout plan." },
      { status: 400 },
    );
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to start a workout." },
      { status: 401 },
    );
  const { data: plan } = await supabase
    .from("exercise_plans")
    .select("id, exercises")
    .eq("id", parsed.data.planId)
    .eq("profile_id", user.id)
    .single();
  const planExercises = (plan?.exercises ?? []) as Array<
    Record<string, unknown>
  >;
  if (!plan || !planExercises.length)
    return NextResponse.json(
      { error: "This workout has no exercises." },
      { status: 400 },
    );
  const { data: session, error } = await supabase
    .from("workout_sessions")
    .insert({
      exercise_plan_id: plan.id,
      exercises: planExercises
        .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
        .map((exercise, sortOrder) => ({
          id: crypto.randomUUID(),
          name: String(exercise.name),
          planned_sets: Number(exercise.sets),
          planned_reps: Number(exercise.reps),
          completed_sets: 0,
          weight_lb:
            exercise.weight_lb === null ? null : Number(exercise.weight_lb),
          rest_seconds: Number(exercise.rest_seconds),
          sort_order: sortOrder,
        })),
    })
    .select("id, exercises")
    .single();
  if (error || !session)
    return NextResponse.json(
      { error: "Could not start workout." },
      { status: 500 },
    );
  return NextResponse.json(
    {
      id: session.id,
      exerciseIds: ((session.exercises ?? []) as Array<Record<string, unknown>>)
        .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
        .map((exercise) => String(exercise.id)),
    },
    { status: 201 },
  );
}
