"use client";

import { useState } from "react";
import { type DailyNutrition, recommendMealIdeas } from "@/lib/recommendations";
import { Button, Card } from "@/components/ui";

export function WhatShouldIEatNowPanel({
  dailyGoal,
  caloriesLogged,
  nutritionLogged,
  isOpen,
  onOpen,
}: {
  dailyGoal: number | null;
  caloriesLogged: number;
  nutritionLogged: DailyNutrition;
  isOpen: boolean;
  onOpen: () => void;
}) {
  const ideas = recommendMealIdeas({
    dailyGoal,
    caloriesLogged,
    nutritionLogged,
  });
  const [ideaIndex, setIdeaIndex] = useState(0);
  const idea = ideas[ideaIndex % ideas.length];

  function handleAction() {
    if (isOpen) {
      setIdeaIndex((currentIndex) => currentIndex + 1);
      return;
    }
    setIdeaIndex(0);
    onOpen();
  }

  return (
    <div className="mt-8 space-y-6">
      <Card className="bg-gradient-to-br from-emerald-50 to-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">What should I eat now?</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              A fun idea shaped by what you have logged today.
            </p>
          </div>
          <Button onClick={handleAction} type="button">
            {isOpen ? "Refresh idea" : "Get an idea"}
          </Button>
        </div>
      </Card>
      {isOpen ? (
        <Card aria-live="polite" className="border-emerald-100">
          <p className="text-sm font-semibold text-emerald-600">TRY THIS</p>
          <h3 className="mt-1 text-2xl font-bold">{idea.title}</h3>
          <p className="mt-3 leading-7 text-slate-600">{idea.description}</p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Macro label="Calories" value={`${idea.calories} kcal`} />
            <Macro label="Protein" value={`${idea.protein} g`} />
            <Macro label="Carbs" value={`${idea.carbs} g`} />
            <Macro label="Fat" value={`${idea.fat} g`} />
          </div>
          <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
            {idea.reason}
          </p>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            Nutrition is an estimate. Adjust serving sizes for your appetite,
            dietary needs, and the ingredients you have available.
          </p>
        </Card>
      ) : null}
    </div>
  );
}

function Macro({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-900">{value}</p>
    </div>
  );
}
