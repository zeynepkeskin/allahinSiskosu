import { EmptyState } from "@/components/ui";
export default function RecommendationsPage() {
  return (
    <>
      <header>
        <p className="text-sm font-semibold text-emerald-600">
          NUTRITION ASSISTANT
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Food recommendations
        </h1>
        <p className="mt-2 text-slate-500">
          Check how a food fits into your remaining calorie budget.
        </p>
      </header>
      <div className="mt-8">
        <EmptyState
          title="Ask about a food"
          description="The recommendation engine will estimate nutrition and suggest a portion based on your day."
        />
      </div>
    </>
  );
}
