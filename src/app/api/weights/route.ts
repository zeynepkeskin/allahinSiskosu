import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { kilogramsToPounds, poundsToKilograms } from "@/lib/units";
import { syncProfileWeightFromLatestEntry } from "@/lib/profile-weight-sync";

const weightSchema = z.object({
  weight: z.number().min(55).max(1100),
  date: z.string().date(),
});
function unauthorized() {
  return NextResponse.json(
    { error: "Sign in to manage weight entries." },
    { status: 401 },
  );
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();
  const { data, error } = await supabase
    .from("daily_weights")
    .select("id, weight, date")
    .eq("profile_id", user.id)
    .order("date", { ascending: false });
  if (error)
    return NextResponse.json(
      { error: "Could not load weight entries." },
      { status: 500 },
    );
  return NextResponse.json(
    (data ?? []).map((entry) => ({
      ...entry,
      weight: kilogramsToPounds(Number(entry.weight)),
    })),
  );
}

export async function POST(request: Request) {
  const result = weightSchema.safeParse(await request.json().catch(() => null));
  if (!result.success)
    return NextResponse.json(
      { error: "Enter a valid weight and date." },
      { status: 400 },
    );
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();
  const { data, error } = await supabase
    .from("daily_weights")
    .upsert(
      {
        profile_id: user.id,
        weight: poundsToKilograms(result.data.weight),
        date: result.data.date,
      },
      { onConflict: "profile_id,date" },
    )
    .select("id, weight, date")
    .single();
  if (error || !data)
    return NextResponse.json(
      { error: "Could not save weight entry." },
      { status: 500 },
    );
  const profileSync = await syncProfileWeightFromLatestEntry(user.id);
  return NextResponse.json(
    {
      ...data,
      weight: kilogramsToPounds(Number(data.weight)),
      dailyCalorieGoal: profileSync.dailyCalorieGoal,
      profileSyncError: profileSync.error,
    },
    { status: 201 },
  );
}
