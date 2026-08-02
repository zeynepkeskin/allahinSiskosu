import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

type ReminderProfile = { id: string; reminder_time: string; reminder_time_zone: string | null };
type PushSubscription = { endpoint: string; p256dh: string; auth: string };

function dateKeyInTimeZone(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return `${get("year")}-${String(get("month")).padStart(2, "0")}-${String(get("day")).padStart(2, "0")}`;
}

function addCalendarDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function startOfDayInTimeZone(dateKey: string, timeZone: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  let timestamp = Date.UTC(year, month - 1, day);
  for (let index = 0; index < 2; index += 1) {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date(timestamp));
    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
    const renderedAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
    timestamp = Date.UTC(year, month - 1, day) - (renderedAsUtc - timestamp);
  }
  return new Date(timestamp);
}

function dayOfWeek(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`).getUTCDay();
}

function dueNow(time: string, timeZone: string) {
  const rendered = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
  return rendered >= time.slice(0, 5);
}

Deno.serve(async (request) => {
  const cronSecret = Deno.env.get("REMINDER_CRON_SECRET");
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) return new Response("Unauthorized", { status: 401 });
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const subject = Deno.env.get("VAPID_SUBJECT");
  if (!url || !serviceRoleKey || !publicKey || !privateKey || !subject) return Response.json({ error: "Push is not configured." }, { status: 503 });

  webpush.setVapidDetails(subject, publicKey, privateKey);
  const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: profiles, error } = await supabase.from("profiles").select("id, reminder_time, reminder_time_zone").eq("reminder_enabled", true).not("reminder_time_zone", "is", null);
  if (error) return Response.json({ error: "Could not load reminders." }, { status: 500 });

  let delivered = 0;
  for (const profile of (profiles ?? []) as ReminderProfile[]) {
    const timeZone = profile.reminder_time_zone!;
    if (!dueNow(profile.reminder_time, timeZone)) continue;
    const today = dateKeyInTimeZone(new Date(), timeZone);
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
    const { error: claimError } = await supabase.from("event_log").insert({ profile_id: profile.id, event_type: "reminder_sent", entity_type: "profile", entity_id: profile.id, event_date: today, metadata: { missingMeal, missingWorkout, reminderTime: profile.reminder_time, timeZone } });
    if (claimError) continue;
    await Promise.all((subscriptions as PushSubscription[]).map(async (subscription) => {
      const missing = [missingMeal && "log a meal", missingWorkout && "complete your planned workout"].filter(Boolean).join(" and ");
      try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({ title: "Fitlog evening reminder", body: `Don’t forget to ${missing} today.`, url: "/dashboard" }));
        delivered += 1;
      } catch (pushError) {
        const statusCode = (pushError as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
      }
    }));
  }
  return Response.json({ delivered });
});
