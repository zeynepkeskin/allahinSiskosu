import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ timeZone: z.string().min(1).max(100) });

export async function POST(request: Request) {
  const result = schema.safeParse(await request.json().catch(() => null));
  if (!result.success) return NextResponse.json({ error: "Invalid timezone." }, { status: 400 });
  try {
    Intl.DateTimeFormat("en", { timeZone: result.data.timeZone });
  } catch {
    return NextResponse.json({ error: "Invalid timezone." }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await supabase.from("profiles").update({ reminder_time_zone: result.data.timeZone }).eq("id", user.id);
  const response = NextResponse.json({ ok: true });
  response.cookies.set("time_zone", result.data.timeZone, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
