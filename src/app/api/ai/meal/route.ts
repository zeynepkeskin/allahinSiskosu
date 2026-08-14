import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import {
  mealAnalysisRequestSchema,
  mealAnalysisSchema,
  parsedMealSchema,
} from "@/lib/nutrition";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const systemPrompt = `You validate food descriptions and estimate nutrition. First decide whether the input names at least one identifiable food, drink, ingredient, or common dish. Accept ordinary wording, minor typos, broad but recognizable foods such as "pizza" or "a sandwich", and descriptions without a serving size. Reject text that only expresses a preference or placeholder, such as "something good", "something healthy", "food", "a meal", or "a snack", because it does not identify what was consumed. Never invent an "unknown food" or nutrition for unclear input.

Set isClear to false for unclear input, briefly ask the user to name the food or drink in clarification, and return null mealName with an empty items array. Set isClear to true for clear input, set clarification to null, and provide the complete meal estimate. Break every listed food into a distinct item; do not omit foods, combine unrelated foods, or stop partway through a list. Use realistic estimates for stated serving sizes and a reasonable standard serving when none is given. Include every numeric field for every item. All numeric values must be non-negative. Confidence is 0 to 1 and reflects how certain the estimate is.`;

const mealResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "meal_nutrition",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["isClear", "clarification", "mealName", "items"],
      properties: {
        isClear: { type: "boolean" },
        clarification: { type: ["string", "null"] },
        mealName: { type: ["string", "null"] },
        items: {
          type: "array",
          minItems: 0,
          maxItems: 20,
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "foodName",
              "serving",
              "calories",
              "protein",
              "carbs",
              "fat",
              "fiber",
              "sugar",
              "confidence",
            ],
            properties: {
              foodName: { type: "string" },
              serving: { type: "string" },
              calories: { type: "integer", minimum: 0 },
              protein: { type: "number", minimum: 0 },
              carbs: { type: "number", minimum: 0 },
              fat: { type: "number", minimum: 0 },
              fiber: { type: "number", minimum: 0 },
              sugar: { type: "number", minimum: 0 },
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
          },
        },
      },
    },
  },
} as const;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to analyze eats." },
      { status: 401 },
    );

  try {
    const requestResult = mealAnalysisRequestSchema.safeParse(
      await request.json(),
    );
    if (!requestResult.success)
      return NextResponse.json(
        { error: "Please enter a valid eat description." },
        { status: 400 },
      );
    const { description } = requestResult.data;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Eat analysis is not configured. Add OPENAI_API_KEY to the server environment.",
        },
        { status: 503 },
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MEAL_MODEL ?? "gpt-5.6-sol",
        reasoning_effort: "medium",
        max_completion_tokens: 4096,
        response_format: mealResponseFormat,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Estimate the nutrition for: ${description}`,
          },
        ],
      }),
    });
    if (!response.ok) {
      console.error(
        "Meal analysis provider error",
        response.status,
        await response.text(),
      );
      return NextResponse.json(
        { error: "Could not analyze this eat. Please try again." },
        { status: 502 },
      );
    }

    const completion = (await response.json()) as {
      choices?: Array<{
        finish_reason?: string;
        message?: { content?: string; refusal?: string };
      }>;
    };
    const choice = completion.choices?.[0];
    const content = choice?.message?.content;
    if (!content || choice.finish_reason === "length")
      throw new Error("AI response was cut off before the estimate finished");
    const result = z
      .object({
        isClear: z.boolean(),
        clarification: z.string().trim().min(1).max(240).nullable(),
        mealName: z.string().trim().min(1).max(120).nullable(),
        items: z.array(parsedMealSchema.shape.items.element).max(20),
      })
      .parse(JSON.parse(content));
    if (!result.isClear)
      return NextResponse.json(
        {
          error:
            result.clarification ??
            "Please name a specific food or drink before analyzing.",
        },
        { status: 422 },
      );
    const parsed = parsedMealSchema.parse({
      mealName: result.mealName,
      items: result.items,
    });
    return NextResponse.json(mealAnalysisSchema.parse(parsed));
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      console.error("Meal analysis returned an invalid response", error);
      return NextResponse.json(
        {
          error:
            "The nutrition provider returned an invalid estimate. Please try again, or split a very long food list into two eats.",
        },
        { status: 502 },
      );
    }
    console.error("Meal analysis failed", error);
    return NextResponse.json(
      { error: "Could not analyze this eat. Please try again." },
      { status: 500 },
    );
  }
}
