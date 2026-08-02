import Link from "next/link";
import { MealsWorkspace } from "@/components/meals-workspace";
import { createClient } from "@/lib/supabase/server";
import { dayOfWeek, todayInTimeZone } from "@/lib/timezone";
import { userTimeZone } from "@/lib/timezone-server";

export default async function MealsPage() {
  const supabase = await createClient();
  const timeZone = await userTimeZone();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const today = todayInTimeZone(timeZone);
  const { data: plan } = await supabase
    .from("exercise_plans")
    .select("is_rest_day")
    .eq("profile_id", user!.id)
    .eq("day_of_week", dayOfWeek(today))
    .maybeSingle();
  return (
    <>
      <header>
        <p className="text-sm font-semibold text-emerald-600">MEAL LOG</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Add a meal</h1>
        <p className="mt-2 text-slate-500">
          Describe what you ate in your own words.
        </p>
      </header>
      {plan && !plan.is_rest_day ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-950">
          <p>
            Today has a planned strength workout. Meal logging stays tied to
            your intake goal.
          </p>
          <Link className="font-semibold text-sky-800" href="/exercises">
            View workout →
          </Link>
        </div>
      ) : plan?.is_rest_day ? (
        <p className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Today is a planned rest day.
        </p>
      ) : null}
      <MealsWorkspace />
    </>
  );
}
