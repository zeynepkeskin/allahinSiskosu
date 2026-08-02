import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { addCalendarDays, dayOfWeek, startOfDayInTimeZone, todayInTimeZone } from "@/lib/timezone";

type ReminderProfile = { id: string; reminder_time: string; reminder_time_zone: string | null };

function dueNow(time: string, timeZone: string) {
  const now = new Date();
  const rendered = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
  return rendered >= time.slice(0, 5);
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse("Unauthorized", { status: 401 });
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return NextResponse.json({ error: "Push is not configured." }, { status: 503 });
  webpush.setVapidDetails(subject, publicKey, privateKey);
  const supabase = createAdminClient();
  const { data: profiles, error } = await supabase.from("profiles").select("id, reminder_time, reminder_time_zone").eq("reminder_enabled", true).not("reminder_time_zone", "is", null);
  if (error) return NextResponse.json({ error: "Could not load reminders." }, { status: 500 });
  let delivered = 0;
  for (const profile of (profiles ?? []) as ReminderProfile[]) {
    const timeZone = profile.reminder_time_zone!;
    if (!dueNow(profile.reminder_time, timeZone)) continue;
    const today = todayInTimeZone(timeZone);
    const start = startOfDayInTimeZone(today, timeZone);
    const end = startOfDayInTimeZone(addCalendarDays(today, 1), timeZone);
    const [{ count: meals }, { count: workouts }, { data: plan }, { data: subscriptions }] = await Promise.all([
      supabase.from("meals").select("id", { count: "exact", head: true }).eq("profile_id", profile.id).gte("meal_time", start.toISOString()).lt("meal_time", end.toISOString()),
      supabase.from("workout_sessions").select("id", { count: "exact", head: true }).eq("profile_id", profile.id).eq("status", "completed").gte("started_at", start.toISOString()).lt("started_at", end.toISOString()),
      supabase.from("exercise_plans").select("is_rest_day").eq("profile_id", profile.id).eq("day_of_week", dayOfWeek(today)).maybeSingle(),
      supabase.from("push_subscriptions").select("endpoint, p256dh, auth").eq("profile_id", profile.id),
    ]);
    const missingMeal = (meals ?? 0) === 0;
    const missingWorkout = Boolean(plan && !plan.is_rest_day && (workouts ?? 0) === 0);
    if ((!missingMeal && !missingWorkout) || !subscriptions?.length) continue;
    const { error: claimError } = await supabase.from("event_log").insert({
      profile_id: profile.id,
      event_type: "reminder_sent",
      entity_type: "profile",
      entity_id: profile.id,
      event_date: today,
      metadata: { missingMeal, missingWorkout, reminderTime: profile.reminder_time, timeZone },
    });
    if (claimError) continue; // Already sent today, or another cron run claimed it.
    const tasks = subscriptions.map(async (subscription) => {
      const missing = [missingMeal && "log a meal", missingWorkout && "complete your planned workout"].filter(Boolean).join(" and ");
      try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({ title: "Fitlog evening reminder", body: `Don’t forget to ${missing} today.`, url: "/dashboard" }));
        delivered += 1;
      } catch (pushError) {
        const statusCode = (pushError as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
      }
    });
    await Promise.all(tasks);
  }
  return NextResponse.json({ delivered });
}
