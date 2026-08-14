import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const requestSchema = z.object({
  image: z
    .string()
    .max(2_500_000)
    .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/),
});

const photoResultSchema = z.object({
  items: z
    .array(
      z.object({
        amount: z.string().trim().min(1).max(60),
        food: z.string().trim().min(1).max(120),
      }),
    )
    .min(1)
    .max(20),
});

const responseFormat = {
  type: "json_schema",
  json_schema: {
    name: "food_photo_items",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["items"],
      properties: {
        items: {
          type: "array",
          minItems: 1,
          maxItems: 20,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["amount", "food"],
            properties: {
              amount: { type: "string" },
              food: { type: "string" },
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
      { error: "Sign in to read food photos." },
      { status: 401 },
    );

  try {
    const requestResult = requestSchema.safeParse(await request.json());
    if (!requestResult.success)
      return NextResponse.json(
        { error: "Please choose a valid food photo." },
        { status: 400 },
      );

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey)
      return NextResponse.json(
        { error: "Photo analysis is not configured." },
        { status: 503 },
      );

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MEAL_MODEL ?? "gpt-5.6-sol",
        reasoning_effort: "low",
        max_completion_tokens: 1024,
        response_format: responseFormat,
        messages: [
          {
            role: "system",
            content:
              "Identify only visible foods and drinks. Return each distinct food with a concise estimated household serving amount such as '1 slice of', '1 cup of', '2 tablespoons of', or 'about 6 oz of'. Do not include nutrition, commentary, utensils, plates, packaging, or uncertain non-food objects. Make reasonable portion estimates from the image.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "List the food in this photo." },
              {
                type: "image_url",
                image_url: { url: requestResult.data.image, detail: "low" },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(
        "Food photo provider error",
        response.status,
        await response.text(),
      );
      return NextResponse.json(
        { error: "Could not read this photo. Please try again." },
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
    if (!choice?.message?.content || choice.finish_reason === "length")
      throw new Error("Photo response was incomplete");

    const result = photoResultSchema.parse(
      JSON.parse(choice.message.content),
    );
    return NextResponse.json({
      description: result.items
        .map(({ amount, food }) => `${amount} ${food}`)
        .join("\n"),
    });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError)
      console.error("Food photo returned an invalid response", error);
    else console.error("Food photo analysis failed", error);
    return NextResponse.json(
      { error: "Could not read this photo. Please try again." },
      { status: 500 },
    );
  }
}
