import { Card } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
export default function SettingsPage() {
  return (
    <>
      <header>
        <p className="text-sm font-semibold text-emerald-600">PREFERENCES</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-slate-500">Manage your account preferences.</p>
      </header>
      <Card className="mt-8">
        <h2 className="font-semibold">Notifications</h2>
        <p className="mt-2 text-sm text-slate-500">
          Reminder and notification controls will be available here.
        </p>
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
