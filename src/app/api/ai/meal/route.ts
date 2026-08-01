import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  mealAnalysisRequestSchema,
  mealAnalysisSchema,
  parsedMealSchema,
} from "@/lib/nutrition";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const systemPrompt = `You estimate nutrition for food descriptions. Break every food the user lists into a distinct item; do not omit foods, combine unrelated foods, or stop partway through a list. Use realistic estimates for the stated serving sizes. Return the complete JSON object required by the schema, including every numeric field for every item. All numeric values must be non-negative. Confidence is 0 to 1 and reflects how certain the estimate is.`;

const mealResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "meal_nutrition",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["mealName", "items"],
      properties: {
        mealName: { type: "string" },
        items: {
          type: "array",
          minItems: 1,
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
      { error: "Sign in to analyze meals." },
      { status: 401 },
    );

  try {
    const requestResult = mealAnalysisRequestSchema.safeParse(
      await request.json(),
    );
    if (!requestResult.success)
      return NextResponse.json(
        { error: "Please enter a valid meal description." },
        { status: 400 },
      );
    const { description } = requestResult.data;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Meal analysis is not configured. Add OPENAI_API_KEY to the server environment.",
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
        { error: "Could not analyze this meal. Please try again." },
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
    const parsed = parsedMealSchema.parse(JSON.parse(content));
    return NextResponse.json(mealAnalysisSchema.parse(parsed));
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      console.error("Meal analysis returned an invalid response", error);
      return NextResponse.json(
        {
          error:
            "The nutrition provider returned an invalid estimate. Please try again, or split a very long food list into two meals.",
        },
        { status: 502 },
      );
    }
    console.error("Meal analysis failed", error);
    return NextResponse.json(
      { error: "Could not analyze this meal. Please try again." },
      { status: 500 },
    );
  }
}
