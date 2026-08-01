import Link from "next/link";
import { PageHeading } from "@/components/page-heading";

const targets = [
  { label: "Calories", placeholder: "2100", min: "1" },
  { label: "Protein (g)", placeholder: "140", min: "0" },
  { label: "Carbs (g)", placeholder: "220", min: "0" },
  { label: "Fat (g)", placeholder: "65", min: "0" },
];
export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-stone-50 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <Link
          className="inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          href="/dashboard"
        >
          ← Back to dashboard
        </Link>
        <PageHeading
          description="Set the targets that make your daily view meaningful."
          eyebrow="Account settings"
          title="Profile & goals"
        />
        <form className="space-y-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
          <section>
            <h2 className="font-semibold text-stone-950">About you</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-stone-700">
                Display name
                <input
                  className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-stone-900 outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100"
                  placeholder="Your name"
                  type="text"
                />
              </label>
              <label className="text-sm font-medium text-stone-700">
                Height (cm)
                <input
                  className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-stone-900 outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100"
                  min="1"
                  placeholder="175"
                  type="number"
                />
              </label>
            </div>
          </section>
          <section className="border-t border-stone-100 pt-6">
            <h2 className="font-semibold text-stone-950">Daily targets</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {targets.map((target) => (
                <label
                  className="text-sm font-medium text-stone-700"
                  key={target.label}
                >
                  {target.label}
                  <input
                    className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-stone-900 outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100"
                    min={target.min}
                    placeholder={target.placeholder}
                    type="number"
                  />
                </label>
              ))}
            </div>
          </section>
          <button
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 sm:w-auto"
            type="button"
          >
            Save changes
          </button>
          <p className="text-xs text-stone-500">
            Profile saving will be connected in the next phase.
          </p>
        </form>
      </div>
    </main>
  );
}
