import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { addCalendarDays, startOfDayInTimeZone, todayInTimeZone } from "@/lib/timezone";
import { userTimeZone } from "@/lib/timezone-server";

const settingsSchema = z.object({
  enabled: z.boolean(),
  time: z.string().regex(/^([01]\d|2[0-3]):00$/, "Choose a whole-hour time."),
});

function unauthorized() {
  return NextResponse.json({ error: "Sign in to manage reminders." }, { status: 401 });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const timeZone = await userTimeZone();
  const today = todayInTimeZone(timeZone);
  const start = startOfDayInTimeZone(today, timeZone);
  const tomorrow = startOfDayInTimeZone(addCalendarDays(today, 1), timeZone);
  const [{ data: profile, error: profileError }, { count: mealCount, error: mealsError }, { count: workoutCount, error: workoutsError }, { data: plan, error: planError }] = await Promise.all([
    supabase.from("profiles").select("reminder_enabled, reminder_time").eq("id", user.id).single(),
    supabase.from("meals").select("id", { count: "exact", head: true }).eq("profile_id", user.id).gte("meal_time", start.toISOString()).lt("meal_time", tomorrow.toISOString()),
    supabase.from("workout_sessions").select("id", { count: "exact", head: true }).eq("status", "completed").gte("started_at", start.toISOString()).lt("started_at", tomorrow.toISOString()),
    supabase.from("exercise_plans").select("is_rest_day").eq("profile_id", user.id).eq("day_of_week", new Date(`${today}T00:00:00.000Z`).getUTCDay()).maybeSingle(),
  ]);

  if (profileError || mealsError || workoutsError || planError) return NextResponse.json({ error: "Could not load reminder status." }, { status: 500 });
  return NextResponse.json({
    enabled: profile?.reminder_enabled ?? false,
    time: (profile?.reminder_time ?? "20:00").slice(0, 5),
    vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    missingMeal: (mealCount ?? 0) === 0,
    // Workout reminders only apply on a planned training day, never on REST or unplanned days.
    missingWorkout: Boolean(plan && !plan.is_rest_day && (workoutCount ?? 0) === 0),
  });
}

export async function PATCH(request: Request) {
  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid reminder settings." }, { status: 400 });
  if (parsed.data.enabled && !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
    return NextResponse.json({ error: "Push notifications have not been configured yet." }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();
  const { error } = await supabase.from("profiles").update({ reminder_enabled: parsed.data.enabled, reminder_time: parsed.data.time }).eq("id", user.id);
  if (error) return NextResponse.json({ error: "Could not save reminder settings." }, { status: 500 });
  return NextResponse.json({ ...parsed.data });
}
