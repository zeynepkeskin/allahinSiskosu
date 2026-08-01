"use client";

import { useState } from "react";
import type { CoachInsights } from "@/lib/coach";
import { Button, Card, Spinner } from "@/components/ui";

export function WellnessCoachPanel() {
  const [insights, setInsights] = useState<CoachInsights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function getInsights() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/coach", { method: "POST" });
      const payload = (await response.json()) as
        CoachInsights | { error?: string };
      if (!response.ok || !("dailySummary" in payload))
        throw new Error(
          "error" in payload
            ? payload.error
            : "Your coach could not create insights.",
        );
      setInsights(payload);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Your coach could not create insights.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="mt-8 space-y-6">
      <Card className="bg-gradient-to-br from-emerald-50 to-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Your coaching check-in</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Get practical insights from your last seven days of logged meals
              and completed strength workouts. Your coach uses saved data only.
            </p>
          </div>
          <Button disabled={loading} onClick={getInsights} type="button">
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner /> Reviewing meals…
              </span>
            ) : insights ? (
              "Refresh insights"
            ) : (
              "Get my insights"
            )}
          </Button>
        </div>
        {error ? (
          <p aria-live="polite" className="mt-4 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
      </Card>
      {insights ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <InsightCard title="Today" body={insights.dailySummary} />
          <InsightCard title="This week" body={insights.weeklySummary} />
          <InsightCard title="Training" body={insights.trainingSummary} />
          <ListCard
            title="What’s going well"
            items={insights.strengths}
            tone="emerald"
          />
          <ListCard
            title="Small next steps"
            items={insights.improvements}
            tone="amber"
          />
          <Card className="lg:col-span-2">
            <p className="text-sm font-semibold text-emerald-600">MACROS</p>
            <h2 className="mt-1 text-xl font-bold">Macro analysis</h2>
            <p className="mt-4 leading-7 text-slate-600">
              {insights.macroAnalysis}
            </p>
            <p className="mt-5 text-xs leading-5 text-slate-400">
              Coaching is educational and based on your logged meals, not
              medical advice.
            </p>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function InsightCard({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <p className="text-sm font-semibold text-emerald-600">
        {title.toUpperCase()}
      </p>
      <p className="mt-3 leading-7 text-slate-600">{body}</p>
    </Card>
  );
}
function ListCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "emerald" | "amber";
}) {
  const dot = tone === "emerald" ? "bg-emerald-500" : "bg-amber-500";
  return (
    <Card>
      <h2 className="text-xl font-bold">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li
            className="flex gap-3 text-sm leading-6 text-slate-600"
            key={item}
          >
            <span
              aria-hidden="true"
              className={`mt-2 h-2 w-2 shrink-0 rounded-full ${dot}`}
            />
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}
