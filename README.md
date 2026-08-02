# Allah'ın Şişkosu

## Local setup

1. Keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.
2. To enable meal analysis and AI coaching, add a server-only `OPENAI_API_KEY` to `.env.local`. Both default to `gpt-5.6-sol`; optionally override them with `OPENAI_MEAL_MODEL` and `OPENAI_COACH_MODEL`.
3. In Supabase Auth URL Configuration, add `http://localhost:3000/auth/callback` and your Vercel production URL followed by `/auth/callback` as redirect URLs.
4. Run `npm install`, then `npm run dev`.

## Push reminders

Generate a VAPID key pair with `npx web-push generate-vapid-keys`, then configure `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` (for example, `mailto:you@example.com`) in Vercel. Also set `SUPABASE_SERVICE_ROLE_KEY` and a random `CRON_SECRET`. Vercel invokes the reminder route every 15 minutes via `vercel.json`; its `CRON_SECRET` is passed as the authorization bearer token. Apply both `202608020...` Supabase migrations before enabling reminders.

The `/dashboard` route is protected and email confirmations return through `/auth/callback`.
