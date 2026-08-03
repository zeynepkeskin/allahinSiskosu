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

export type MealIdea = {
  title: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  reason: string;
};

/** Suggests food ideas from the user's saved daily intake without an AI call. */
export function recommendMealIdeas({
  dailyGoal,
  caloriesLogged,
  nutritionLogged,
}: {
  dailyGoal: number | null;
  caloriesLogged: number;
  nutritionLogged: DailyNutrition;
}): MealIdea[] {
  const remaining =
    dailyGoal === null ? null : Math.max(dailyGoal - caloriesLogged, 0);
  const proteinTarget =
    dailyGoal === null ? null : Math.round((dailyGoal * 0.3) / 4);
  const carbTarget =
    dailyGoal === null ? null : Math.round((dailyGoal * 0.4) / 4);
  const fatTarget =
    dailyGoal === null ? null : Math.round((dailyGoal * 0.3) / 9);

  if (remaining !== null && remaining <= 150) {
    return [
      {
        title: "Iced protein mocha",
        description:
          "Cold brew blended with milk and a scoop of chocolate protein.",
        calories: 150,
        protein: 25,
        carbs: 10,
        fat: 3,
        reason:
          "You have little calorie room left, so this keeps the choice light while adding protein.",
      },
      {
        title: "Chili-lime cottage cheese cup",
        description:
          "Cottage cheese with cucumber, lime, chili flakes, and everything seasoning.",
        calories: 140,
        protein: 20,
        carbs: 8,
        fat: 3,
        reason:
          "This is a savory, high-protein option that fits a tight remaining budget.",
      },
    ];
  }

  if (
    proteinTarget !== null &&
    carbTarget !== null &&
    nutritionLogged.carbs >= carbTarget &&
    nutritionLogged.protein < proteinTarget
  ) {
    return [
      {
        title: "Chicken shawarma lettuce boats",
        description:
          "Spiced chicken, crunchy lettuce, tomato, pickles, and a little tzatziki.",
        calories: 360,
        protein: 42,
        carbs: 14,
        fat: 16,
        reason:
          "Carbs are already high today, so this makes protein the star without adding many more carbs.",
      },
      {
        title: "Sushi-inspired salmon bowl",
        description:
          "Salmon, cucumber, edamame, seaweed, and cauliflower rice with spicy yogurt sauce.",
        calories: 410,
        protein: 35,
        carbs: 22,
        fat: 20,
        reason:
          "It gives you a fun sushi flavor while shifting the next meal toward protein instead of more starch.",
      },
    ];
  }

  if (fatTarget !== null && nutritionLogged.fat >= fatTarget) {
    return [
      {
        title: "Mango-lime shrimp salad",
        description:
          "Chili-lime shrimp with mango, greens, cucumber, and a bright citrus dressing.",
        calories: 350,
        protein: 36,
        carbs: 30,
        fat: 8,
        reason:
          "Fat is already well covered today, so this keeps the next meal lean and fresh.",
      },
      {
        title: "Turkey taco salad",
        description:
          "Lean turkey, salsa, black beans, shredded lettuce, and pickled jalapeños.",
        calories: 390,
        protein: 39,
        carbs: 34,
        fat: 11,
        reason:
          "This has taco-night energy while keeping fat modest and protein high.",
      },
    ];
  }

  return [
    {
      title: "Build-your-own taco bowl",
      description:
        "Lean protein, black beans, salsa, crunchy cabbage, corn, and a spoon of Greek yogurt.",
      calories: 500,
      protein: 38,
      carbs: 55,
      fat: 16,
      reason:
        "Your intake looks balanced enough for a satisfying, all-round meal with protein, fiber, and flavor.",
    },
    {
      title: "Mediterranean pita pocket",
      description:
        "Chicken or chickpeas, chopped salad, feta, hummus, and lemon-herb yogurt sauce.",
      calories: 470,
      protein: 34,
      carbs: 52,
      fat: 15,
      reason:
        "This is a fun, balanced option that adds a meaningful protein serving to your day.",
    },
  ];
}

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
