import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { kilogramsToPounds, poundsToKilograms } from "@/lib/units";

const weightSchema = z.object({
  weight: z.number().min(55).max(1100),
  date: z.string().date(),
});
async function authorizedEntry(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null };
  const { data } = await supabase
    .from("daily_weights")
    .select("id")
    .eq("id", id)
    .eq("profile_id", user.id)
    .maybeSingle();
  return { supabase, user: data ? user : null };
}
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = weightSchema.safeParse(await request.json().catch(() => null));
  if (!result.success)
    return NextResponse.json(
      { error: "Enter a valid weight and date." },
      { status: 400 },
    );
  const { supabase, user } = await authorizedEntry(id);
  if (!user)
    return NextResponse.json(
      { error: "Weight entry not found." },
      { status: 404 },
    );
  const { data, error } = await supabase
    .from("daily_weights")
    .update({ ...result.data, weight: poundsToKilograms(result.data.weight) })
    .eq("id", id)
    .select("id, weight, date")
    .single();
  if (error || !data)
    return NextResponse.json(
      { error: "Could not update weight entry." },
      { status: 500 },
    );
  return NextResponse.json({
    ...data,
    weight: kilogramsToPounds(Number(data.weight)),
  });
}
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, user } = await authorizedEntry(id);
  if (!user)
    return NextResponse.json(
      { error: "Weight entry not found." },
      { status: 404 },
    );
  const { error } = await supabase.from("daily_weights").delete().eq("id", id);
  if (error)
    return NextResponse.json(
      { error: "Could not delete weight entry." },
      { status: 500 },
    );
  return new NextResponse(null, { status: 204 });
}
