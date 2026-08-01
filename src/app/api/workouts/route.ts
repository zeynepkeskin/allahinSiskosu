import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const startSchema = z.object({ planId: z.string().uuid() });
export async function POST(request: Request) {
  const parsed = startSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid workout plan." }, { status: 400 });
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to start a workout." }, { status: 401 });
  const { data: plan } = await supabase.from("exercise_plans").select("id, plan_exercises(id, name, sets, reps, weight_display, weight_lb, rest_seconds, sort_order)").eq("id", parsed.data.planId).eq("profile_id", user.id).single();
  if (!plan || !plan.plan_exercises.length) return NextResponse.json({ error: "This workout has no exercises." }, { status: 400 });
  const { data: session, error } = await supabase.from("workout_sessions").insert({ profile_id: user.id, exercise_plan_id: plan.id }).select("id").single();
  if (error || !session) return NextResponse.json({ error: "Could not start workout." }, { status: 500 });
  const exercises = [...plan.plan_exercises].sort((a, b) => a.sort_order - b.sort_order).map((exercise) => ({ workout_session_id: session.id, plan_exercise_id: exercise.id, exercise_name: exercise.name, planned_sets: exercise.sets, planned_reps: exercise.reps, completed_sets: 0, weight_display: exercise.weight_display || (exercise.weight_lb === null ? "Bodyweight" : `${exercise.weight_lb} lb`), rest_seconds: exercise.rest_seconds, sort_order: exercise.sort_order }));
  const { data: sessionExercises, error: exercisesError } = await supabase.from("workout_session_exercises").insert(exercises).select("id, sort_order");
  if (exercisesError || !sessionExercises) return NextResponse.json({ error: "Could not prepare workout." }, { status: 500 });
  return NextResponse.json({ id: session.id, exerciseIds: sessionExercises.sort((a, b) => a.sort_order - b.sort_order).map((exercise) => exercise.id) }, { status: 201 });
}
