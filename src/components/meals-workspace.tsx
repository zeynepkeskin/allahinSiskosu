"use client";
import { useState } from "react";
import { MealHistory } from "@/components/meal-history";
import { MealParser } from "@/components/meal-parser";
export function MealsWorkspace() {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <>
      <MealParser onSaved={() => setRefreshKey((value) => value + 1)} />
      <MealHistory refreshKey={refreshKey} />
    </>
  );
}
