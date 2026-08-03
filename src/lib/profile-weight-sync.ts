import {
  calculateProfileGoals,
  type ActivityLevel,
  type Gender,
  type Goal,
} from "@/lib/calculations";
import { createClient } from "@/lib/supabase/server";

const genders = new Set<Gender>([
  "female",
  "male",
  "non_binary",
  "prefer_not_to_say",
]);
const activityLevels = new Set<ActivityLevel>([
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
  "extra_active",
]);
const goals = new Set<Goal>(["lose", "maintain", "gain"]);

type ProfileForGoals = {
  height_cm: number | string | null;
  birthday: string | null;
  gender: string | null;
  activity_level: string | null;
  goal: string | null;
};

function dailyCalorieGoal(profile: ProfileForGoals, weightKg: number) {
  const heightCm = Number(profile.height_cm);
  if (
    !Number.isFinite(heightCm) ||
    !profile.birthday ||
    !genders.has(profile.gender as Gender) ||
    !activityLevels.has(profile.activity_level as ActivityLevel) ||
    !goals.has(profile.goal as Goal)
  )
    return null;

  return calculateProfileGoals({
    heightIn: heightCm / 2.54,
    weightLb: weightKg / 0.45359237,
    birthday: profile.birthday,
    gender: profile.gender as Gender,
    activityLevel: profile.activity_level as ActivityLevel,
    goal: profile.goal as Goal,
  }).dailyCalorieGoal;
}

/** Keeps the profile's current weight and calorie goal aligned with its latest log. */
export async function syncProfileWeightFromLatestEntry(userId: string) {
  const supabase = await createClient();
  const [{ data: latestEntry, error: weightError }, { data: profile, error: profileError }] =
    await Promise.all([
      supabase
        .from("daily_weights")
        .select("weight")
        .eq("profile_id", userId)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("height_cm, birthday, gender, activity_level, goal")
        .eq("id", userId)
        .maybeSingle(),
    ]);

  if (weightError || profileError || !profile) return { dailyCalorieGoal: null, error: true };

  // Deleting the last entry should not erase the profile value the user explicitly saved.
  if (!latestEntry) return { dailyCalorieGoal: null, error: false };

  const weightKg = Number(latestEntry.weight);
  const goal = dailyCalorieGoal(profile, weightKg);
  const { error } = await supabase
    .from("profiles")
    .update({
      weight_kg: weightKg,
      ...(goal === null ? {} : { daily_calorie_goal: goal }),
    })
    .eq("id", userId);

  return { dailyCalorieGoal: goal, error: Boolean(error) };
}
