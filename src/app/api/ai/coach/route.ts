import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { nutritionCoachSchema } from "@/lib/coach";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type MealRow = {
  meal_time: string;
  total_calories: number | string;
  protein: number | string;
  carbs: number | string;
  fat: number | string;
  fiber: number | string;
};
type DailyNutrition = {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

const responseFormat = {
  type: "json_schema",
  json_schema: {
    name: "nutrition_coaching",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "dailySummary",
        "weeklySummary",
        "strengths",
        "improvements",
        "macroAnalysis",
      ],
      properties: {
        dailySummary: { type: "string" },
        weeklySummary: { type: "string" },
        strengths: {
          type: "array",
          minItems: 1,
          maxItems: 3,
          items: { type: "string" },
        },
        improvements: {
          type: "array",
          minItems: 1,
          maxItems: 3,
          items: { type: "string" },
        },
        macroAnalysis: { type: "string" },
      },
    },
  },
} as const;
const systemPrompt =
  "You are a supportive nutrition coach. Use only the provided logged nutrition data; do not invent foods, activity, medical conditions, or diagnoses. Give practical, non-judgmental coaching in plain language. Identify observable strengths and small, specific improvements. Do not prescribe treatment, guarantee outcomes, shame the user, or give advice for an eating disorder. State when the logging data is limited. Keep every field concise.";
const number = (value: number | string) => Number(value) || 0;
const dayKey = (value: Date) => value.toISOString().slice(0, 10);

function buildDailyData(meals: MealRow[]): DailyNutrition[] {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (6 - index));
    const key = dayKey(date);
    const totals = meals
      .filter((meal) => dayKey(new Date(meal.meal_time)) === key)
      .reduce(
        (total, meal) => ({
          calories: total.calories + number(meal.total_calories),
          protein: total.protein + number(meal.protein),
          carbs: total.carbs + number(meal.carbs),
          fat: total.fat + number(meal.fat),
          fiber: total.fiber + number(meal.fiber),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      );
    return {
      date: key,
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
      fiber: Math.round(totals.fiber * 10) / 10,
    };
  });
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to use your nutrition coach." },
      { status: 401 },
    );
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey)
    return NextResponse.json(
      {
        error:
          "Nutrition coaching is not configured. Add OPENAI_API_KEY to the server environment.",
      },
      { status: 503 },
    );
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);
    const [{ data: profile }, { data: mealData }] = await Promise.all([
      supabase
        .from("profiles")
        .select("daily_calorie_goal, goal")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("meals")
        .select("meal_time, total_calories, protein, carbs, fat, fiber")
        .eq("profile_id", user.id)
        .gte("meal_time", sevenDaysAgo.toISOString())
        .order("meal_time", { ascending: true }),
    ]);
    const daily = buildDailyData((mealData ?? []) as MealRow[]);
    const loggedDays = daily.filter((day) => day.calories > 0).length;
    if (!loggedDays)
      return NextResponse.json(
        {
          error: "Log at least one meal before asking your coach for insights.",
        },
        { status: 400 },
      );
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_COACH_MODEL ?? "gpt-5.6-sol",
        reasoning_effort: "medium",
        max_completion_tokens: 1800,
        response_format: responseFormat,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: JSON.stringify({
              dailyCalorieGoal: profile?.daily_calorie_goal ?? null,
              goal: profile?.goal ?? null,
              loggedDays,
              daily,
            }),
          },
        ],
      }),
    });
    if (!response.ok) {
      console.error(
        "Nutrition coach provider error",
        response.status,
        await response.text(),
      );
      return NextResponse.json(
        { error: "Your coach is unavailable right now. Please try again." },
        { status: 502 },
      );
    }
    const completion = (await response.json()) as {
      choices?: Array<{
        finish_reason?: string;
        message?: { content?: string };
      }>;
    };
    const choice = completion.choices?.[0];
    if (!choice?.message?.content || choice.finish_reason === "length")
      throw new Error("Coach response was incomplete");
    return NextResponse.json(
      nutritionCoachSchema.parse(JSON.parse(choice.message.content)),
    );
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError)
      console.error("Nutrition coach returned an invalid response", error);
    else console.error("Nutrition coach failed", error);
    return NextResponse.json(
      { error: "Your coach could not create insights. Please try again." },
      { status: 500 },
    );
  }
}
