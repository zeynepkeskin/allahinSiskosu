import { WeightTracker, type WeightEntry } from "@/components/weight-tracker";
import { createClient } from "@/lib/supabase/server";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("daily_weights")
    .select("id, weight, date")
    .eq("profile_id", user!.id)
    .order("date", { ascending: false });
  const entries: WeightEntry[] = (data ?? []).map((entry) => ({
    id: entry.id,
    weight: Number(entry.weight),
    date: entry.date,
  }));
  return (
    <>
      <header>
        <p className="text-sm font-semibold text-emerald-600">INSIGHTS</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Your progress
        </h1>
        <p className="mt-2 text-slate-500">
          Track your weight and see how it changes over time.
        </p>
      </header>
      <WeightTracker initialEntries={entries} />
    </>
  );
}
