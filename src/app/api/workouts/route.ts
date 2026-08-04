import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { todayInTimeZone } from "@/lib/timezone";
import { userTimeZone } from "@/lib/timezone-server";

const startSchema = z.object({
  planId: z.string().uuid(),
  completedSets: z
    .array(
      z.object({
        exerciseIndex: z.number().int().min(0),
        completedSets: z.number().int().min(1).max(30),
      }),
    )
    .min(1),
  status: z.enum(["completed", "ended_early"]).optional(),
});

type SessionExercise = Record<string, unknown>;

function updateCompletedSets(
  exercises: SessionExercise[],
  completedSets: Map<number, number>,
) {
  return exercises.map((exercise, index) => {
    const completed = completedSets.get(index);
    return completed === undefined
      ? exercise
      : {
          ...exercise,
          completed_sets: Number(exercise.completed_sets ?? 0) + completed,
        };
  });
}

export async function POST(request: Request) {
  const parsed = startSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Complete at least one workout set." },
      { status: 400 },
    );

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to record a workout." },
      { status: 401 },
    );

  const { data: plan } = await supabase
    .from("exercise_plans")
    .select("id, exercises")
    .eq("id", parsed.data.planId)
    .eq("profile_id", user.id)
    .single();
  const planExercises = (plan?.exercises ?? []) as SessionExercise[];
  if (!plan || !planExercises.length)
    return NextResponse.json(
      { error: "This workout has no exercises." },
      { status: 400 },
    );
  if (
    parsed.data.completedSets.some(
      ({ exerciseIndex }) => exerciseIndex >= planExercises.length,
    )
  )
    return NextResponse.json(
      { error: "Invalid workout exercise." },
      { status: 400 },
    );

  const workoutDate = todayInTimeZone(await userTimeZone());
  const completedSets = new Map(
    parsed.data.completedSets.map((exercise) => [
      exercise.exerciseIndex,
      exercise.completedSets,
    ]),
  );
  const { data: existing } = await supabase
    .from("workout_sessions")
    .select("id, exercises, exercise_plans!inner(profile_id)")
    .eq("exercise_plans.profile_id", user.id)
    .eq("workout_date", workoutDate)
    .maybeSingle();

  const sessionExercises = existing
    ? updateCompletedSets(
        (existing.exercises ?? []) as SessionExercise[],
        completedSets,
      )
    : updateCompletedSets(
        planExercises
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
        completedSets,
      );
  const update = {
    exercises: sessionExercises,
    ...(parsed.data.status
      ? { status: parsed.data.status, completed_at: new Date().toISOString() }
      : {}),
  };

  let session: { id: string; exercises: unknown } | null = existing;
  if (session) {
    const { data, error } = await supabase
      .from("workout_sessions")
      .update(update)
      .eq("id", session.id)
      .select("id, exercises")
      .single();
    if (error || !data)
      return NextResponse.json(
        { error: "Could not save workout." },
        { status: 500 },
      );
    session = data;
  } else {
    const { data, error } = await supabase
      .from("workout_sessions")
      .insert({
        exercise_plan_id: plan.id,
        workout_date: workoutDate,
        ...update,
      })
      .select("id, exercises")
      .single();
    if (error || !data)
      return NextResponse.json(
        { error: "Could not save workout." },
        { status: 500 },
      );
    session = data;
  }

  return NextResponse.json({
    id: session.id,
    exerciseIds: ((session.exercises ?? []) as SessionExercise[])
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
      .map((exercise) => String(exercise.id)),
    completedSetCounts: ((session.exercises ?? []) as SessionExercise[])
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
      .map((exercise) => Number(exercise.completed_sets ?? 0)),
  });
}
