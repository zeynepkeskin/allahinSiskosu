import type { MealAnalysis } from "@/lib/nutrition";

export type FoodRecommendation = {
  tone: "fits" | "reduce" | "avoid" | "setup";
  title: string;
  message: string;
  suggestedServing?: string;
};

/** Keeps the calorie-budget decision deterministic and auditable. */
export function recommendFood({
  analysis,
  dailyGoal,
  caloriesLogged,
}: {
  analysis: MealAnalysis;
  dailyGoal: number | null;
  caloriesLogged: number;
}): FoodRecommendation {
  if (!dailyGoal) {
    return {
      tone: "setup",
      title: "Set a calorie goal first",
      message:
        "We estimated this food, but need your daily calorie target to judge how it fits.",
    };
  }

  const remaining = Math.max(dailyGoal - caloriesLogged, 0);
  const calories = analysis.totals.calories;
  if (calories <= remaining) {
    return {
      tone: "fits",
      title: "This fits your budget",
      message: `${calories} kcal fits within your ${remaining} kcal remaining today.`,
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
  };
}
