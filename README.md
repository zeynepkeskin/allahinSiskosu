# Allah'ın Şişkosu

## Local setup

1. Keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.
2. To enable meal analysis and AI coaching, add a server-only `OPENAI_API_KEY` to `.env.local`. Both default to `gpt-5.6-sol`; optionally override them with `OPENAI_MEAL_MODEL` and `OPENAI_COACH_MODEL`.
3. In Supabase Auth URL Configuration, add `http://localhost:3000/auth/callback` and your Vercel production URL followed by `/auth/callback` as redirect URLs.
4. Run `npm install`, then `npm run dev`.

## Push reminders

Generate a VAPID key pair with `npx web-push generate-vapid-keys`. In Vercel, set only `NEXT_PUBLIC_VAPID_PUBLIC_KEY` so browsers can subscribe. In Supabase Edge Function secrets, set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (for example, `mailto:you@example.com`), and a random `REMINDER_CRON_SECRET`.

Before applying `20260802030000_schedule_push_reminders.sql`, add two Supabase Vault secrets named `project_url` (your `https://<project-ref>.supabase.co` URL) and `reminder_cron_secret` (the same value as `REMINDER_CRON_SECRET`). Deploy the `send-reminders` Edge Function, then apply all `202608020...` migrations. Supabase Cron invokes the function at the top of every hour, so reminder times are whole hours.

For a linked Supabase project, deploy with `supabase functions deploy send-reminders` and apply the migrations with `supabase db push`. The Edge Function's `REMINDER_CRON_SECRET` must exactly match the Vault `reminder_cron_secret`; it protects the function from public invocation.

The `/dashboard` route is protected and email confirmations return through `/auth/callback`..
