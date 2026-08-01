import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
        Dashboard
      </p>
      <h1 className="mt-2 text-3xl font-bold">
        Welcome{user.email ? `, ${user.email}` : ""}.
      </h1>
      <p className="mt-3 text-slate-600">
        Your account is ready. Meal tracking is coming in the next phase.
      </p>
    </main>
  );
}
