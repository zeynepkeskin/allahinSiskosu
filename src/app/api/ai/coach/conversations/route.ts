import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const conversationIdSchema = z.string().uuid();
const updateSchema = z.object({
  id: conversationIdSchema,
  title: z.string().trim().min(1).max(200),
});

async function signedIn() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function unauthorized() {
  return NextResponse.json(
    { error: "Sign in to use your coach." },
    { status: 401 },
  );
}

export async function GET() {
  const { supabase, user } = await signedIn();
  if (!user) return unauthorized();
  const { data, error } = await supabase
    .from("coach_conversations")
    .select("id, title, created_at, updated_at")
    .eq("profile_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error)
    return NextResponse.json(
      { error: "Could not load conversations." },
      { status: 500 },
    );
  return NextResponse.json({ conversations: data ?? [] });
}

export async function PATCH(request: Request) {
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Provide a valid conversation title." },
      { status: 400 },
    );
  const { supabase, user } = await signedIn();
  if (!user) return unauthorized();
  const { data, error } = await supabase
    .from("coach_conversations")
    .update({ title: parsed.data.title })
    .eq("id", parsed.data.id)
    .eq("profile_id", user.id)
    .select("id, title, updated_at")
    .maybeSingle();
  if (error)
    return NextResponse.json(
      { error: "Could not update the conversation." },
      { status: 500 },
    );
  if (!data)
    return NextResponse.json(
      { error: "Conversation not found." },
      { status: 404 },
    );
  return NextResponse.json({ conversation: data });
}

export async function DELETE(request: Request) {
  const parsed = z
    .object({ id: conversationIdSchema })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Provide a valid conversation." },
      { status: 400 },
    );
  const { supabase, user } = await signedIn();
  if (!user) return unauthorized();
  const { data, error } = await supabase
    .from("coach_conversations")
    .delete()
    .eq("id", parsed.data.id)
    .eq("profile_id", user.id)
    .select("id")
    .maybeSingle();
  if (error)
    return NextResponse.json(
      { error: "Could not delete the conversation." },
      { status: 500 },
    );
  if (!data)
    return NextResponse.json(
      { error: "Conversation not found." },
      { status: 404 },
    );
  return NextResponse.json({ deleted: true });
}
