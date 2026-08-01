import Link from "next/link";
import { Card, EmptyState, ProgressBar } from "@/components/ui";

export default function DashboardPage() {
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-emerald-600">OVERVIEW</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Good day!</h1>
          <p className="mt-2 text-slate-500">
            Your nutrition summary will appear here as you log meals.
          </p>
        </div>
        <Link
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          href="/meals"
        >
          + Add meal
        </Link>
      </header>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Calories today" value="—" hint="Start by adding a meal" />
        <Stat label="Remaining" value="—" hint="Set your daily goal" />
        <Stat label="Protein" value="— g" hint="No meals logged" />
        <Stat label="Weekly average" value="— kcal" hint="No data yet" />
      </div>
      <div className="mt-7 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <h2 className="font-semibold">Daily progress</h2>
          <p className="mt-1 text-sm text-slate-500">
            Your macro balance for today.
          </p>
          <div className="mt-6 space-y-5">
            <ProgressBar label="Protein" value={0} />
            <ProgressBar label="Carbs" value={0} />
            <ProgressBar label="Fat" value={0} />
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <h2 className="font-semibold">This week</h2>
          <div className="mt-8 grid h-36 grid-cols-7 items-end gap-2">
            {[34, 52, 26, 62, 42, 75, 20].map((height, i) => (
              <div
                className="rounded-t-md bg-emerald-100"
                key={i}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Log meals to see your calorie trend.
          </p>
        </Card>
      </div>
      <div className="mt-7">
        <EmptyState
          title="No meals logged today"
          description="Tell us what you ate and review the nutrition estimate before saving it."
          action={
            <Link
              className="text-sm font-semibold text-emerald-700"
              href="/meals"
            >
              Log your first meal →
            </Link>
          }
        />
      </div>
    </>
  );
}
function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{hint}</p>
    </Card>
  );
}
