import { ProfileForm } from "@/components/profile-form";
import { createClient } from "@/lib/supabase/server";
import { centimetersToInches, kilogramsToPounds } from "@/lib/units";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("height_cm, weight_kg, target_weight, birthday, gender, activity_level, goal")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <>
      <header>
        <p className="text-sm font-semibold text-emerald-600">ACCOUNT</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Your profile</h1>
        <p className="mt-2 text-slate-500">
          Complete your details to build a calorie target tailored to you.
        </p>
      </header>
      <ProfileForm
        profile={{
          heightIn: profile?.height_cm
            ? centimetersToInches(Number(profile.height_cm))
            : undefined,
          weightLb: profile?.weight_kg
            ? kilogramsToPounds(Number(profile.weight_kg))
            : undefined,
          targetWeight: profile?.target_weight
            ? kilogramsToPounds(Number(profile.target_weight))
            : undefined,
          birthday: profile?.birthday ?? undefined,
          gender: profile?.gender ?? undefined,
          activityLevel: profile?.activity_level ?? undefined,
          goal: profile?.goal ?? undefined,
        }}
      />
    </>
  );
}
