import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to use your coach." }, { status: 401 });
  const { data, error } = await supabase
    .from("coach_conversations")
    .select("id, title, created_at, updated_at")
    .eq("profile_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: "Could not load conversations." }, { status: 500 });
  return NextResponse.json({ conversations: data ?? [] });
}
