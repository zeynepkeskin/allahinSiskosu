import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  estimateWorkoutCalories,
  type WorkoutExerciseForCalories,
} from "@/lib/workout-calories";

const updateSchema = z.object({
  completedSets: z
    .array(
      z.object({
        id: z.string().uuid(),
        completedSets: z.number().int().min(0).max(30),
      }),
    )
    .optional(),
  status: z.enum(["completed", "ended_early"]).optional(),
});
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success || !parsed.success)
    return NextResponse.json(
      { error: "Invalid workout update." },
      { status: 400 },
    );
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to update a workout." },
      { status: 401 },
    );
  const { data: session, error: fetchError } = await supabase
    .from("workout_sessions")
    .select("exercises")
    .eq("id", id)
    .single();
  if (fetchError || !session)
    return NextResponse.json(
      { error: "Could not update workout." },
      { status: 500 },
    );
  const completedSets = new Map(
    (parsed.data.completedSets ?? []).map((exercise) => [
      exercise.id,
      exercise.completedSets,
    ]),
  );
  const exercises = (
    (session.exercises ?? []) as Array<
      WorkoutExerciseForCalories & Record<string, unknown>
    >
  ).map((exercise) => {
    const completed = completedSets.get(String(exercise.id));
    return completed === undefined
      ? exercise
      : { ...exercise, completed_sets: completed };
  });
  const { data: profile } = await supabase
    .from("profiles")
    .select("weight_kg")
    .eq("id", user.id)
    .maybeSingle();
  const estimatedCalories = estimateWorkoutCalories(
    exercises,
    profile?.weight_kg,
  );
  const { error } = await supabase
    .from("workout_sessions")
    .update({
      exercises,
      estimated_cal_burned: estimatedCalories,
      ...(parsed.data.status
        ? {
            status: parsed.data.status,
            completed_at: new Date().toISOString(),
          }
        : {}),
    })
    .eq("id", id);
  if (error)
    return NextResponse.json(
      { error: "Could not finish workout." },
      { status: 500 },
    );
  return NextResponse.json({ ok: true, estimatedCalBurned: estimatedCalories });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success)
    return NextResponse.json(
      { error: "Invalid workout session." },
      { status: 400 },
    );
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to delete a workout." },
      { status: 401 },
    );
  const { error } = await supabase
    .from("workout_sessions")
    .delete()
    .eq("id", id);
  if (error)
    return NextResponse.json(
      { error: "Could not delete workout." },
      { status: 500 },
    );
  return NextResponse.json({ ok: true });
}
