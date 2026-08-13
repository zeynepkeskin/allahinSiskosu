import { exerciseCatalog, muscleLabels, type MuscleId } from "@/lib/exercise-catalog";
import { days } from "@/lib/exercises";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;
type JsonObject = Record<string, unknown>;

export const coachInstructions = `You are a helpful, practical nutrition and strength coach inside a fitness tracking app.
Use tools whenever the answer depends on the user's profile, equipment, meals, workouts, or plans. Never claim to have reviewed data without calling the relevant tool. Treat missing logs as missing information, not evidence that the user ate or exercised nothing. Be concise, supportive, and specific. Do not shame, diagnose, prescribe treatment, encourage extreme restriction, or imply exercise increases a calorie budget. For symptoms, injuries, eating-disorder concerns, pregnancy, or other high-risk medical topics, recommend an appropriate clinician. Do not invent foods, workouts, equipment, or goals. Explain uncertainty. You have read-only tools: never say that you changed or saved app data. When suggesting exercises, respect known equipment and ask a brief clarifying question if equipment is unknown.`;

const dateRangeParameters = {
  type: "object",
  additionalProperties: false,
  properties: {
    days: { type: "integer", minimum: 1, maximum: 90 },
    limit: { type: "integer", minimum: 1, maximum: 100 },
  },
  required: ["days", "limit"],
} as const;

export const coachTools = [
  tool("get_user_profile", "Get the user's fitness profile, goals, body measurements, and equipment.", emptyParameters()),
  tool("get_available_equipment", "Get equipment the user says is available.", emptyParameters()),
  tool("list_recent_meals", "List recently logged meals and their macros.", dateRangeParameters),
  tool("get_nutrition_summary", "Calculate daily nutrition totals over a recent date range.", dateRangeParameters),
  tool("list_recent_workouts", "List recent completed or partially completed workout sessions.", dateRangeParameters),
  tool("analyze_muscle_coverage", "Deterministically score muscle coverage from recently completed workout sets.", dateRangeParameters),
  tool("list_exercise_plans", "Get the user's scheduled and free-form exercise plans.", emptyParameters()),
  tool("search_exercise_catalog", "Search exercises by name, category, muscle, and equipment.", {
    type: "object",
    additionalProperties: false,
    properties: {
      query: { type: ["string", "null"] },
      muscle: { type: ["string", "null"] },
      equipment: { type: ["string", "null"] },
      limit: { type: "integer", minimum: 1, maximum: 20 },
    },
    required: ["query", "muscle", "equipment", "limit"],
  }),
] as const;

function emptyParameters() {
  return { type: "object", additionalProperties: false, properties: {}, required: [] } as const;
}

function tool(name: string, description: string, parameters: object) {
  return { type: "function", name, description, strict: true, parameters } as const;
}

function asNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function boundedArgs(args: JsonObject) {
  return {
    days: Math.min(90, Math.max(1, Math.round(asNumber(args.days) || 14))),
    limit: Math.min(100, Math.max(1, Math.round(asNumber(args.limit) || 30))),
  };
}

function since(daysAgo: number) {
  return new Date(Date.now() - daysAgo * 86_400_000).toISOString();
}

function exerciseEquipment(item: unknown): string[] {
  const value = (item as JsonObject).equipment;
  return Array.isArray(value) ? value.map(String) : [];
}

function equipmentForExercise(name: string, item: unknown): string[] {
  const explicit = exerciseEquipment(item);
  if (explicit.length) return explicit;
  const normalized = name.toLowerCase();
  const equipment = new Set<string>();
  if (normalized.includes("dumbbell")) equipment.add("dumbbells");
  if (normalized.includes("barbell") || normalized.includes("front squat")) {
    equipment.add("barbell");
    equipment.add("weight_plates");
  }
  if (normalized.includes("bench press") || normalized.includes("flye"))
    equipment.add("bench");
  if (normalized.includes("cable") || normalized.includes("pulldown") || normalized.includes("pushdown"))
    equipment.add("cable_machine");
  if (normalized.includes("band")) equipment.add("resistance_bands");
  if (normalized.includes("kettlebell")) equipment.add("kettlebells");
  if (normalized.includes("pullup") || normalized.includes("hanging leg"))
    equipment.add("pull_up_bar");
  if (normalized.includes("dip")) equipment.add("dip_station");
  if (normalized.includes("leg press") || normalized.includes("leg extension") || normalized.includes("leg curl"))
    equipment.add("weight_machine");
  if (!equipment.size) equipment.add("bodyweight");
  return [...equipment];
}

export async function executeCoachTool(
  name: string,
  args: JsonObject,
  supabase: Supabase,
  userId: string,
) {
  if (name === "get_user_profile" || name === "get_available_equipment") {
    const { data, error } = await supabase
      .from("profiles")
      .select("username, height_cm, weight_kg, target_weight, birthday, gender, activity_level, goal, daily_calorie_goal, available_equipment")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    if (name === "get_available_equipment")
      return { equipment: data?.available_equipment ?? [], configured: Array.isArray(data?.available_equipment) && data.available_equipment.length > 0 };
    return data ?? { profile: null };
  }

  if (name === "list_recent_meals" || name === "get_nutrition_summary") {
    const range = boundedArgs(args);
    const { data, error } = await supabase
      .from("meals")
      .select("id, meal_name, meal_time, total_calories, protein, carbs, fat, fiber")
      .eq("profile_id", userId)
      .gte("meal_time", since(range.days))
      .order("meal_time", { ascending: false })
      .limit(range.limit);
    if (error) throw error;
    const meals = data ?? [];
    if (name === "list_recent_meals") return { rangeDays: range.days, count: meals.length, meals };
    const daily = new Map<string, { calories: number; protein: number; carbs: number; fat: number; fiber: number; meals: number }>();
    for (const meal of meals) {
      const date = String(meal.meal_time).slice(0, 10);
      const total = daily.get(date) ?? { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, meals: 0 };
      total.calories += asNumber(meal.total_calories);
      total.protein += asNumber(meal.protein);
      total.carbs += asNumber(meal.carbs);
      total.fat += asNumber(meal.fat);
      total.fiber += asNumber(meal.fiber);
      total.meals++;
      daily.set(date, total);
    }
    return { rangeDays: range.days, loggedDays: daily.size, daily: [...daily].map(([date, totals]) => ({ date, ...totals })) };
  }

  if (name === "list_recent_workouts" || name === "analyze_muscle_coverage") {
    const range = boundedArgs(args);
    const { data, error } = await supabase
      .from("workout_sessions")
      .select("id, started_at, completed_at, status, exercises, exercise_plans!inner(profile_id)")
      .eq("exercise_plans.profile_id", userId)
      .gte("started_at", since(range.days))
      .order("started_at", { ascending: false })
      .limit(range.limit);
    if (error) throw error;
    const sessions = data ?? [];
    if (name === "list_recent_workouts")
      return {
        rangeDays: range.days,
        count: sessions.length,
        workouts: sessions.map((session) => ({
          id: session.id,
          started_at: session.started_at,
          completed_at: session.completed_at,
          status: session.status,
          exercises: session.exercises,
        })),
      };
    const scores = Object.fromEntries(Object.keys(muscleLabels).map((muscle) => [muscle, 0])) as Record<MuscleId, number>;
    let completedSets = 0;
    for (const session of sessions) {
      for (const raw of (Array.isArray(session.exercises) ? session.exercises : []) as JsonObject[]) {
        const sets = Math.max(0, asNumber(raw.completed_sets));
        const visual = exerciseCatalog[String(raw.name)];
        if (!sets || !visual) continue;
        completedSets += sets;
        visual.primary.forEach((muscle) => (scores[muscle] += sets));
        visual.secondary.forEach((muscle) => (scores[muscle] += sets * 0.5));
      }
    }
    const coverage = Object.entries(scores)
      .map(([muscle, score]) => ({ muscle, label: muscleLabels[muscle as MuscleId], score }))
      .sort((a, b) => b.score - a.score);
    return { rangeDays: range.days, workoutCount: sessions.length, completedSets, method: "primary muscle = 1 point/set; secondary = 0.5 points/set", coverage, omitted: coverage.filter((item) => item.score === 0).map((item) => item.label) };
  }

  if (name === "list_exercise_plans") {
    const { data, error } = await supabase
      .from("exercise_plans")
      .select("id, day_of_week, plan_type, exercises, updated_at")
      .eq("profile_id", userId)
      .order("day_of_week", { ascending: true });
    if (error) throw error;
    return { plans: (data ?? []).map((plan) => ({ ...plan, day: plan.day_of_week === null ? null : days[plan.day_of_week] })) };
  }

  if (name === "search_exercise_catalog") {
    const query = typeof args.query === "string" ? args.query.toLowerCase().trim() : "";
    const muscle = typeof args.muscle === "string" ? args.muscle.toLowerCase().trim() : "";
    const equipment = typeof args.equipment === "string" ? args.equipment.toLowerCase().trim() : "";
    const limit = Math.min(20, Math.max(1, Math.round(asNumber(args.limit) || 10)));
    const matches = Object.entries(exerciseCatalog).filter(([exerciseName, item]) => {
      const muscles = [...item.primary, ...item.secondary];
      const gear = equipmentForExercise(exerciseName, item);
      return (!query || `${exerciseName} ${item.category}`.toLowerCase().includes(query)) && (!muscle || muscles.some((itemMuscle) => itemMuscle.includes(muscle) || muscle.includes(itemMuscle))) && (!equipment || gear.some((piece) => piece.toLowerCase().includes(equipment)));
    }).slice(0, limit).map(([exerciseName, item]) => ({ name: exerciseName, category: item.category, primaryMuscles: item.primary.map((muscleId) => muscleLabels[muscleId]), secondaryMuscles: item.secondary.map((muscleId) => muscleLabels[muscleId]), equipment: equipmentForExercise(exerciseName, item) }));
    return { count: matches.length, exercises: matches };
  }

  throw new Error("Unknown coach tool");
}

export function responseText(response: JsonObject) {
  if (typeof response.output_text === "string") return response.output_text;
  const output = Array.isArray(response.output) ? response.output : [];
  return output.flatMap((item) => {
    const content = Array.isArray((item as JsonObject).content) ? (item as JsonObject).content as JsonObject[] : [];
    return content.filter((part) => part.type === "output_text" && typeof part.text === "string").map((part) => String(part.text));
  }).join("");
}
