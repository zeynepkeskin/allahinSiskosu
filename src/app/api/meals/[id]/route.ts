import { NextResponse } from "next/server";
import { mealAnalysisSchema, updateMealSchema } from "@/lib/nutrition";
import { createClient } from "@/lib/supabase/server";

async function authorizedMeal(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null };
  const { data: meal } = await supabase
    .from("meals")
    .select("id")
    .eq("id", id)
    .eq("profile_id", user.id)
    .maybeSingle();
  return { supabase, user: meal ? user : null };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, user } = await authorizedMeal(id);
  if (!user)
    return NextResponse.json({ error: "Eat not found." }, { status: 404 });
  const result = updateMealSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!result.success)
    return NextResponse.json(
      { error: "Please provide a valid eat." },
      { status: 400 },
    );
  if (!result.data.mealName || !result.data.items)
    return NextResponse.json(
      { error: "An eat name and its items are required." },
      { status: 400 },
    );
  const analysis = mealAnalysisSchema.parse(result.data);
  const { error } = await supabase
    .from("meals")
    .update({
      meal_name: analysis.mealName,
      meal_time: result.data.mealTime,
      total_calories: analysis.totals.calories,
      protein: analysis.totals.protein,
      carbs: analysis.totals.carbs,
      fat: analysis.totals.fat,
      fiber: analysis.totals.fiber,
    })
    .eq("id", id);
  if (error)
    return NextResponse.json(
      { error: "Could not update eat." },
      { status: 500 },
    );
  const { error: deleteError } = await supabase
    .from("meal_items")
    .delete()
    .eq("meal_id", id);
  const { error: insertError } = await supabase
    .from("meal_items")
    .insert(
      analysis.items.map((item) => ({
        meal_id: id,
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
  if (deleteError || insertError)
    return NextResponse.json(
      { error: "Could not update eat items." },
      { status: 500 },
    );
  return NextResponse.json({
    ...analysis,
    id,
    mealTime: result.data.mealTime ?? new Date().toISOString(),
  });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, user } = await authorizedMeal(id);
  if (!user)
    return NextResponse.json({ error: "Eat not found." }, { status: 404 });
  const { error } = await supabase.from("meals").delete().eq("id", id);
  if (error)
    return NextResponse.json(
      { error: "Could not delete eat." },
      { status: 500 },
    );
  return new NextResponse(null, { status: 204 });
}
