import { z } from "zod";

const nonNegativeNumber = z.number().finite().min(0);

export const mealItemSchema = z.object({
  foodName: z.string().trim().min(1).max(120),
  serving: z.string().trim().min(1).max(120),
  calories: z.number().int().min(0).max(10000),
  protein: nonNegativeNumber.max(1000),
  carbs: nonNegativeNumber.max(1000),
  fat: nonNegativeNumber.max(1000),
  fiber: nonNegativeNumber.max(1000),
  sugar: nonNegativeNumber.max(1000),
  confidence: z.number().finite().min(0).max(1),
});

export const parsedMealSchema = z.object({
  mealName: z.string().trim().min(1).max(120),
  items: z.array(mealItemSchema).min(1).max(20),
});

export const mealAnalysisSchema = parsedMealSchema.transform((meal) => {
  const totals = meal.items.reduce(
    (total, item) => ({
      calories: total.calories + item.calories,
      protein: total.protein + item.protein,
      carbs: total.carbs + item.carbs,
      fat: total.fat + item.fat,
      fiber: total.fiber + item.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );

  return {
    ...meal,
    totals: {
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
      fiber: Math.round(totals.fiber * 10) / 10,
    },
  };
});

export const mealAnalysisRequestSchema = z.object({
  description: z.string().trim().min(3, "Describe the food you ate.").max(2000),
});

export const saveMealSchema = parsedMealSchema.extend({
  mealTime: z
    .string()
    .refine(
      (value) => !Number.isNaN(Date.parse(value)),
      "Eat time must be a valid date.",
    )
    .optional(),
});

export const updateMealSchema = saveMealSchema
  .partial()
  .refine((meal) => Object.keys(meal).length > 0, "Provide an eat update.");

export type MealAnalysis = z.infer<typeof mealAnalysisSchema>;
export type SavedMeal = MealAnalysis & {
  id: string;
  mealTime: string;
};
