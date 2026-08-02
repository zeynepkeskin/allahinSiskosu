-- A browser may have several push subscriptions for a single user (for example,
-- a phone and a laptop). The timezone is saved on the profile so the scheduled
-- job can evaluate the user's reminder without relying on a browser cookie.
alter table public.profiles
  add column reminder_time_zone text;

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_log (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null check (char_length(trim(event_type)) > 0),
  entity_type text not null check (char_length(trim(entity_type)) > 0),
  entity_id uuid,
  event_date date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(metadata) = 'object')
);

create index push_subscriptions_profile_id_idx on public.push_subscriptions (profile_id);
create index event_log_profile_created_at_idx on public.event_log (profile_id, created_at desc);
create unique index event_log_one_reminder_per_day_idx
  on public.event_log (profile_id, event_type, event_date)
  where event_type = 'reminder_sent' and event_date is not null;

create trigger push_subscriptions_set_updated_at before update on public.push_subscriptions for each row execute function public.set_updated_at();

alter table public.push_subscriptions enable row level security;
alter table public.event_log enable row level security;

create policy "Users manage their own push subscriptions" on public.push_subscriptions for all to authenticated
using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
