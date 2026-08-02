import { Card } from "@/components/ui";
import { ReminderSettings } from "@/components/reminder-settings";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/server";
export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: settings } = await supabase.from("profiles").select("reminder_enabled, reminder_time").eq("id", user!.id).maybeSingle();
  return (
    <>
      <header>
        <p className="text-sm font-semibold text-emerald-600">PREFERENCES</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-slate-500">Manage your account preferences.</p>
      </header>
      <Card className="mt-8">
        <h2 className="font-semibold">Notifications</h2>
        <p className="mt-2 text-sm text-slate-500">Use your browser’s notifications to get a nudge at the time you choose.</p>
        <ReminderSettings initialEnabled={settings?.reminder_enabled ?? false} initialTime={(settings?.reminder_time ?? "20:00").slice(0, 5)} />
      </Card>
      <Card className="mt-5">
        <h2 className="font-semibold">Appearance</h2>
        <p className="mt-2 text-sm text-slate-500">
          Choose a theme that feels comfortable at any time of day.
        </p>
        <ThemeToggle />
      </Card>
    </>
  );
}
