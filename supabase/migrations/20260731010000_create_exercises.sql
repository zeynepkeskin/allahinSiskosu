create table public.exercise_plans (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  is_rest_day boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, day_of_week)
);

create table public.plan_exercises (
  id uuid primary key default gen_random_uuid(),
  exercise_plan_id uuid not null references public.exercise_plans (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  sets smallint not null check (sets between 1 and 30),
  reps smallint not null check (reps between 1 and 500),
  weight_lb numeric(7, 2) check (weight_lb is null or weight_lb >= 0),
  weight_display text,
  rest_seconds smallint not null default 45 check (rest_seconds between 0 and 1800),
  sort_order smallint not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  exercise_plan_id uuid references public.exercise_plans (id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'ended_early')),
  created_at timestamptz not null default now()
);

create table public.workout_session_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_session_id uuid not null references public.workout_sessions (id) on delete cascade,
  plan_exercise_id uuid references public.plan_exercises (id) on delete set null,
  exercise_name text not null,
  planned_sets smallint not null check (planned_sets > 0),
  planned_reps smallint not null check (planned_reps > 0),
  completed_sets smallint not null default 0 check (completed_sets >= 0),
  weight_display text,
  rest_seconds smallint not null check (rest_seconds >= 0),
  sort_order smallint not null check (sort_order >= 0)
);

create index exercise_plans_profile_day_idx on public.exercise_plans (profile_id, day_of_week);
create index plan_exercises_plan_order_idx on public.plan_exercises (exercise_plan_id, sort_order);
create index workout_sessions_profile_started_idx on public.workout_sessions (profile_id, started_at desc);
create index workout_session_exercises_session_order_idx on public.workout_session_exercises (workout_session_id, sort_order);

create trigger exercise_plans_set_updated_at before update on public.exercise_plans for each row execute function public.set_updated_at();
create trigger plan_exercises_set_updated_at before update on public.plan_exercises for each row execute function public.set_updated_at();

alter table public.exercise_plans enable row level security;
alter table public.plan_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_session_exercises enable row level security;

create policy "Users manage their own exercise plans" on public.exercise_plans for all to authenticated
using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
create policy "Users manage exercises in their own plans" on public.plan_exercises for all to authenticated
using (exists (select 1 from public.exercise_plans where exercise_plans.id = plan_exercises.exercise_plan_id and exercise_plans.profile_id = (select auth.uid())))
with check (exists (select 1 from public.exercise_plans where exercise_plans.id = plan_exercises.exercise_plan_id and exercise_plans.profile_id = (select auth.uid())));
create policy "Users manage their own workout sessions" on public.workout_sessions for all to authenticated
using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
create policy "Users manage their own workout exercises" on public.workout_session_exercises for all to authenticated
using (exists (select 1 from public.workout_sessions where workout_sessions.id = workout_session_exercises.workout_session_id and workout_sessions.profile_id = (select auth.uid())))
with check (exists (select 1 from public.workout_sessions where workout_sessions.id = workout_session_exercises.workout_session_id and workout_sessions.profile_id = (select auth.uid())));
