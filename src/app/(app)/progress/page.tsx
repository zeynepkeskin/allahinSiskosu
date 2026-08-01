import { Card, EmptyState } from "@/components/ui";
export default function ProgressPage() {
  return (
    <>
      <header>
        <p className="text-sm font-semibold text-emerald-600">INSIGHTS</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Your progress
        </h1>
        <p className="mt-2 text-slate-500">
          Follow changes in your weight and nutrition over time.
        </p>
      </header>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Weight trend</h2>
          <p className="mt-2 text-sm text-slate-500">
            Weight entries will be visualized here.
          </p>
        </Card>
        <Card>
          <h2 className="font-semibold">Calories & macros</h2>
          <p className="mt-2 text-sm text-slate-500">
            Your nutrition trends will be visualized here.
          </p>
        </Card>
      </div>
      <div className="mt-6">
        <EmptyState
          title="No progress data yet"
          description="Log meals and weight entries to begin building your progress history."
        />
      </div>
    </>
  );
}
