import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  mealAnalysisRequestSchema,
  mealAnalysisSchema,
  parsedMealSchema,
} from "@/lib/nutrition";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const systemPrompt = `You estimate nutrition for food descriptions. Return only JSON matching the requested schema. Break the meal into distinct foods. Use realistic estimates for the stated serving sizes. All numeric values must be non-negative. Confidence is 0 to 1 and reflects how certain the estimate is.`;

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
    const { description } = mealAnalysisRequestSchema.parse(
      await request.json(),
    );
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
        model: process.env.OPENAI_MEAL_MODEL ?? "gpt-4.1-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
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
      console.error("Meal analysis provider error", response.status);
      return NextResponse.json(
        { error: "Could not analyze this meal. Please try again." },
        { status: 502 },
      );
    }

    const completion = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = completion.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI response had no content");
    const parsed = parsedMealSchema.parse(JSON.parse(content));
    return NextResponse.json(mealAnalysisSchema.parse(parsed));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Please enter a valid meal description." },
        { status: 400 },
      );
    }
    console.error("Meal analysis failed", error);
    return NextResponse.json(
      { error: "Could not analyze this meal. Please try again." },
      { status: 500 },
    );
  }
}
