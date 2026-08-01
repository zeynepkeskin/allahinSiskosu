import Link from "next/link";
import { PageHeading } from "@/components/page-heading";

const stats = [
  { label: "Current weight", value: "—", unit: "kg" },
  { label: "Weekly change", value: "—", unit: "kg" },
  { label: "Check-ins", value: "0", unit: "this month" },
];
export default function ProgressPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <Link
          className="inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          href="/dashboard"
        >
          ← Back to dashboard
        </Link>
        <PageHeading
          description="Track your weight alongside the habits that support your goal."
          eyebrow="Your journey"
          title="Progress"
        />
        <section className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <article
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
              key={stat.label}
            >
              <p className="text-sm text-stone-500">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold text-stone-950">
                {stat.value}{" "}
                <span className="text-base font-medium text-stone-500">
                  {stat.unit}
                </span>
              </p>
            </article>
          ))}
        </section>
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-semibold text-stone-950">Weight trend</h2>
          <div className="mt-6 grid min-h-64 place-items-center rounded-xl border border-dashed border-stone-300 bg-stone-50 px-6 text-center">
            <div>
              <p className="font-medium text-stone-800">
                Your trend will appear here
              </p>
              <p className="mt-1 text-sm leading-6 text-stone-500">
                Add your first weight check-in to start seeing progress over
                time.
              </p>
              <button
                className="mt-4 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white"
                type="button"
              >
                Add weight
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
