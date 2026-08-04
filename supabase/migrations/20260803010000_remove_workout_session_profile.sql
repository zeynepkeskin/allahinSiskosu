drop policy if exists "Users manage their own workout sessions" on public.workout_sessions;
drop index if exists public.workout_sessions_profile_started_idx;

alter table public.workout_sessions
  alter column exercise_plan_id set not null,
  drop column if exists profile_id;

create index if not exists workout_sessions_plan_started_idx
on public.workout_sessions (exercise_plan_id, started_at desc);

create policy "Users manage their own workout sessions" on public.workout_sessions for all to authenticated
using (exists (select 1 from public.exercise_plans where exercise_plans.id = workout_sessions.exercise_plan_id and exercise_plans.profile_id = (select auth.uid())))
with check (exists (select 1 from public.exercise_plans where exercise_plans.id = workout_sessions.exercise_plan_id and exercise_plans.profile_id = (select auth.uid())));
