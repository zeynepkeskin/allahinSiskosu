import { NextResponse } from "next/server";
import { z } from "zod";
import { exerciseSchema } from "@/lib/exercises";
import { createClient } from "@/lib/supabase/server";
import { todayInTimeZone } from "@/lib/timezone";
import { userTimeZone } from "@/lib/timezone-server";
import { estimateWorkoutCalories } from "@/lib/workout-calories";

const recordSchema = z.object({
  exercise: exerciseSchema.extend({ id: z.string().uuid() }),
  completedSets: z.number().int().min(1).max(30),
});

type StoredExercise = Record<string, unknown> & {
  id: string;
  completed_sets: number;
  planned_reps: number;
  weight_lb: number | null;
  rest_seconds: number;
  set_duration_seconds: number | null;
};

async function freeFormPlan(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: existing } = await supabase
    .from("exercise_plans")
    .select("id")
    .eq("profile_id", userId)
    .eq("plan_type", "free_form")
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from("exercise_plans")
    .insert({
      profile_id: userId,
      day_of_week: null,
      plan_type: "free_form",
      exercises: [],
    })
    .select("id")
    .single();
  if (error || !data) {
    const { data: raced } = await supabase
      .from("exercise_plans")
      .select("id")
      .eq("profile_id", userId)
      .eq("plan_type", "free_form")
      .single();
    return raced;
  }
  return data;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to start a workout." },
      { status: 401 },
    );
  const plan = await freeFormPlan(supabase, user.id);
  if (!plan)
    return NextResponse.json(
      { error: "Could not create the Free Form plan." },
      { status: 500 },
    );

  const { data: session } = await supabase
    .from("workout_sessions")
    .select("id, status, exercises, estimated_cal_burned")
    .eq("exercise_plan_id", plan.id)
    .eq("workout_date", todayInTimeZone(await userTimeZone()))
    .maybeSingle();
  return NextResponse.json({ planId: plan.id, session });
}

export async function POST(request: Request) {
  const parsed = recordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid Free Form exercise." },
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
  const plan = await freeFormPlan(supabase, user.id);
  if (!plan)
    return NextResponse.json(
      { error: "Could not create the Free Form plan." },
      { status: 500 },
    );

  const workoutDate = todayInTimeZone(await userTimeZone());
  const { data: existing } = await supabase
    .from("workout_sessions")
    .select("id, exercises")
    .eq("exercise_plan_id", plan.id)
    .eq("workout_date", workoutDate)
    .maybeSingle();
  const exercises = [...((existing?.exercises ?? []) as StoredExercise[])];
  const input = parsed.data.exercise;
  const index = exercises.findIndex((item) => item.id === input.id);
  const stored: StoredExercise = {
    id: input.id,
    name: input.name,
    planned_sets: input.sets,
    planned_reps: input.reps,
    completed_sets: parsed.data.completedSets,
    weight_lb: input.weightLb,
    rest_seconds: input.restSeconds,
    set_duration_seconds: input.setDurationSeconds,
    sort_order:
      index === -1 ? exercises.length : Number(exercises[index].sort_order),
  };
  if (index === -1) exercises.push(stored);
  else exercises[index] = stored;

  const { data: profile } = await supabase
    .from("profiles")
    .select("weight_kg")
    .eq("id", user.id)
    .maybeSingle();
  const estimatedCalories = estimateWorkoutCalories(
    exercises,
    profile?.weight_kg,
  );
  const write = {
    exercises,
    estimated_cal_burned: estimatedCalories,
    status: "in_progress",
    completed_at: null,
  };
  const query = existing
    ? supabase.from("workout_sessions").update(write).eq("id", existing.id)
    : supabase
        .from("workout_sessions")
        .insert({
          exercise_plan_id: plan.id,
          workout_date: workoutDate,
          ...write,
        });
  const { data: session, error } = await query.select("id").single();
  if (error || !session)
    return NextResponse.json(
      { error: "Could not save this completed set." },
      { status: 500 },
    );
  return NextResponse.json({
    id: session.id,
    exercises,
    estimatedCalBurned: estimatedCalories,
  });
}
