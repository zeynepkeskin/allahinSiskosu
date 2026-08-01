import { Card } from "@/components/ui";
const fields = [
  "Height",
  "Current weight",
  "Target weight",
  "Birthday",
  "Gender",
  "Activity level",
  "Goal",
];
export default function ProfilePage() {
  return (
    <>
      <header>
        <p className="text-sm font-semibold text-emerald-600">ACCOUNT</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Your profile</h1>
        <p className="mt-2 text-slate-500">
          Your details will help create a personalized calorie target.
        </p>
      </header>
      <Card className="mt-8">
        <div className="grid gap-5 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field}>
              <p className="text-sm font-medium text-slate-500">{field}</p>
              <p className="mt-1 font-semibold text-slate-800">Not set</p>
            </div>
          ))}
        </div>
        <button
          className="mt-7 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white opacity-50"
          disabled
          type="button"
        >
          Complete profile (coming soon)
        </button>
      </Card>
    </>
  );
}
