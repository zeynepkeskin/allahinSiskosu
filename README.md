# Allah'ın Şişkosu

## Local setup

1. Keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.
2. To enable meal analysis, add a server-only `OPENAI_API_KEY` (and optionally `OPENAI_MEAL_MODEL`, which defaults to `gpt-4.1-mini`) to `.env.local`.
3. In Supabase Auth URL Configuration, add `http://localhost:3000/auth/callback` and your Vercel production URL followed by `/auth/callback` as redirect URLs.
4. Run `npm install`, then `npm run dev`.

The `/dashboard` route is protected and email confirmations return through `/auth/callback`.
