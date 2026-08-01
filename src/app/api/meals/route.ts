import { NextResponse } from "next/server";
import { mealAnalysisSchema, saveMealSchema } from "@/lib/nutrition";
import { createClient } from "@/lib/supabase/server";

function unauthorized() {
  return NextResponse.json(
    { error: "Sign in to manage meals." },
    { status: 401 },
  );
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { data, error } = await supabase
    .from("meals")
    .select(
      "id, meal_name, meal_time, total_calories, protein, carbs, fat, fiber, meal_items (food_name, serving, calories, protein, carbs, fat, fiber, sugar, confidence)",
    )
    .eq("profile_id", user.id)
    .order("meal_time", { ascending: false });
  if (error) {
    console.error("Could not fetch meals", error);
    return NextResponse.json(
      { error: "Could not load meals." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    (data ?? []).map((meal) => ({
      id: meal.id,
      mealName: meal.meal_name,
      mealTime: meal.meal_time,
      totals: {
        calories: meal.total_calories,
        protein: Number(meal.protein),
        carbs: Number(meal.carbs),
        fat: Number(meal.fat),
        fiber: Number(meal.fiber),
      },
      items: meal.meal_items.map((item) => ({
        foodName: item.food_name,
        serving: item.serving,
        calories: item.calories,
        protein: Number(item.protein),
        carbs: Number(item.carbs),
        fat: Number(item.fat),
        fiber: Number(item.fiber),
        sugar: Number(item.sugar),
        confidence: Number(item.confidence),
      })),
    })),
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();
  const result = saveMealSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!result.success)
    return NextResponse.json(
      { error: "Please provide a valid meal." },
      { status: 400 },
    );
  const analysis = mealAnalysisSchema.parse(result.data);
  const { data: meal, error: mealError } = await supabase
    .from("meals")
    .insert({
      profile_id: user.id,
      meal_name: analysis.mealName,
      meal_time: result.data.mealTime ?? new Date().toISOString(),
      total_calories: analysis.totals.calories,
      protein: analysis.totals.protein,
      carbs: analysis.totals.carbs,
      fat: analysis.totals.fat,
      fiber: analysis.totals.fiber,
    })
    .select("id, meal_time")
    .single();
  if (mealError || !meal) {
    console.error("Could not save meal", mealError);
    return NextResponse.json(
      { error: "Could not save meal." },
      { status: 500 },
    );
  }
  const { error: itemsError } = await supabase.from("meal_items").insert(
    analysis.items.map((item) => ({
      meal_id: meal.id,
      food_name: item.foodName,
      serving: item.serving,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      fiber: item.fiber,
      sugar: item.sugar,
      confidence: item.confidence,
    })),
  );
  if (itemsError) {
    console.error("Could not save meal items", itemsError);
    await supabase.from("meals").delete().eq("id", meal.id);
    return NextResponse.json(
      { error: "Could not save meal." },
      { status: 500 },
    );
  }
  return NextResponse.json(
    { ...analysis, id: meal.id, mealTime: meal.meal_time },
    { status: 201 },
  );
}
