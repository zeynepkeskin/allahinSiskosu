# Deployment

1. Create a Supabase project and copy its Project URL and publishable key from the Connect dialog.
2. Copy `.env.example` to `.env.local` and add those values for local development.
3. In Supabase Auth URL Configuration, add `http://localhost:3000/auth/callback` and your Vercel URL followed by `/auth/callback` as redirect URLs.
4. Import this repository into Vercel. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the Vercel project settings, then deploy.

No server-side secret is required for the Phase 0 authentication flow.
