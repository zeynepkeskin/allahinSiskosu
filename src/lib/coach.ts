import { z } from "zod";

const coachLine = z.string().trim().min(1).max(600);

export const nutritionCoachSchema = z.object({
  dailySummary: coachLine,
  weeklySummary: coachLine,
  strengths: z.array(z.string().trim().min(1).max(240)).min(1).max(3),
  improvements: z.array(z.string().trim().min(1).max(240)).min(1).max(3),
  macroAnalysis: coachLine,
});

export type NutritionCoach = z.infer<typeof nutritionCoachSchema>;
