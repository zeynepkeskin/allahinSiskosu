import type { MealAnalysis } from "@/lib/nutrition";

export type FoodRecommendation = {
  tone: "fits" | "reduce" | "avoid" | "setup";
  title: string;
  message: string;
  suggestedServing?: string;
  nutritionNote?: string;
};

export type DailyNutrition = {
  protein: number;
  carbs: number;
  fat: number;
};

/** Keeps the calorie-budget decision deterministic and auditable. */
export function recommendFood({
  analysis,
  dailyGoal,
  caloriesLogged,
  nutritionLogged,
}: {
  analysis: MealAnalysis;
  dailyGoal: number | null;
  caloriesLogged: number;
  nutritionLogged: DailyNutrition;
}): FoodRecommendation {
  if (!dailyGoal) {
    return {
      tone: "setup",
      title: "Set a calorie goal first",
      message:
        "We estimated this food, but need your daily calorie target to judge how it fits.",
    };
  }

  const proteinTarget = Math.round((dailyGoal * 0.3) / 4);
  const carbTarget = Math.round((dailyGoal * 0.4) / 4);
  const fatTarget = Math.round((dailyGoal * 0.3) / 9);
  const nutritionNote = macroGuidance({
    analysis,
    nutritionLogged,
    proteinTarget,
    carbTarget,
    fatTarget,
  });
  const remaining = Math.max(dailyGoal - caloriesLogged, 0);
  const calories = analysis.totals.calories;
  if (calories <= remaining) {
    return {
      tone: "fits",
      title: "This fits your budget",
      message: `${calories} kcal fits within your ${remaining} kcal remaining today.`,
      nutritionNote,
    };
  }

  const overBy = calories - remaining;
  const slightlyOver = overBy <= Math.max(100, Math.round(remaining * 0.2));
  if (remaining > 0 && slightlyOver) {
    const portion = Math.max(
      10,
      Math.floor(((remaining / calories) * 100) / 5) * 5,
    );
    return {
      tone: "reduce",
      title: "Try a smaller serving",
      message: `The full serving is ${overBy} kcal over your remaining budget. A portion around ${portion}% would fit today.`,
      suggestedServing: `${portion}% of the estimated serving`,
      nutritionNote,
    };
  }

  return {
    tone: "avoid",
    title:
      remaining === 0 ? "Save this for another day" : "Consider an alternative",
    message:
      remaining === 0
        ? `You have already reached today's ${dailyGoal} kcal goal. This adds ${calories} kcal.`
        : `This is ${overBy} kcal over your remaining budget. Consider a lighter alternative or save it for another day.`,
    nutritionNote,
  };
}

function macroGuidance({
  analysis,
  nutritionLogged,
  proteinTarget,
  carbTarget,
  fatTarget,
}: {
  analysis: MealAnalysis;
  nutritionLogged: DailyNutrition;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
}) {
  if (nutritionLogged.carbs >= carbTarget && analysis.totals.protein < 20) {
    return `You have already logged ${Math.round(nutritionLogged.carbs)} g of carbs, above the ${carbTarget} g daily guide. Prioritize a protein-rich choice next; this food provides ${analysis.totals.protein} g protein.`;
  }

  if (nutritionLogged.protein < proteinTarget * 0.8) {
    return `Protein is still behind the ${proteinTarget} g daily guide. This food provides ${analysis.totals.protein} g protein, so choose a protein-rich accompaniment or alternative if needed.`;
  }

  if (nutritionLogged.fat >= fatTarget) {
    return `You have already logged ${Math.round(nutritionLogged.fat)} g of fat, around the ${fatTarget} g daily guide. A leaner protein option would balance the rest of the day.`;
  }

  return undefined;
}
