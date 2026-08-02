import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ timeZone: z.string().min(1).max(100) });

export async function POST(request: Request) {
  const result = schema.safeParse(await request.json().catch(() => null));
  if (!result.success) return NextResponse.json({ error: "Invalid timezone." }, { status: 400 });
  try {
    Intl.DateTimeFormat("en", { timeZone: result.data.timeZone });
  } catch {
    return NextResponse.json({ error: "Invalid timezone." }, { status: 400 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set("time_zone", result.data.timeZone, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
