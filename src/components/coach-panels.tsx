"use client";

import { useState } from "react";
import { CanIEatThisPanel } from "@/components/can-i-eat-this-panel";
import { WellnessCoachPanel } from "@/components/nutrition-coach";
import type { DailyNutrition } from "@/lib/recommendations";

export function CoachPanels({
  dailyGoal,
  caloriesLogged,
  nutritionLogged,
}: {
  dailyGoal: number | null;
  caloriesLogged: number;
  nutritionLogged: DailyNutrition;
}) {
  const [openPanel, setOpenPanel] = useState<"coach" | "food" | null>(null);

  return (
    <>
      <WellnessCoachPanel
        isOpen={openPanel === "coach"}
        onOpen={() => setOpenPanel("coach")}
      />
      <CanIEatThisPanel
        caloriesLogged={caloriesLogged}
        dailyGoal={dailyGoal}
        isOpen={openPanel === "food"}
        nutritionLogged={nutritionLogged}
        onOpen={() => setOpenPanel("food")}
      />
    </>
  );
}
