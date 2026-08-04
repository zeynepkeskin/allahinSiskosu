create table public.exercise_plans (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  is_rest_day boolean not null default false,
  exercises jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, day_of_week)
);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  exercise_plan_id uuid not null references public.exercise_plans (id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'ended_early')),
  exercises jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index exercise_plans_profile_day_idx on public.exercise_plans (profile_id, day_of_week);
create index workout_sessions_plan_started_idx on public.workout_sessions (exercise_plan_id, started_at desc);

create trigger exercise_plans_set_updated_at before update on public.exercise_plans for each row execute function public.set_updated_at();

alter table public.exercise_plans enable row level security;
alter table public.workout_sessions enable row level security;

create policy "Users manage their own exercise plans" on public.exercise_plans for all to authenticated
using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
create policy "Users manage their own workout sessions" on public.workout_sessions for all to authenticated
using (exists (select 1 from public.exercise_plans where exercise_plans.id = workout_sessions.exercise_plan_id and exercise_plans.profile_id = (select auth.uid())))
with check (exists (select 1 from public.exercise_plans where exercise_plans.id = workout_sessions.exercise_plan_id and exercise_plans.profile_id = (select auth.uid())));
