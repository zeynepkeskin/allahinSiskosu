alter table public.exercise_plans
add column if not exists exercises jsonb not null default '[]'::jsonb;

alter table public.workout_sessions
add column if not exists exercises jsonb not null default '[]'::jsonb;

drop table if exists public.workout_session_exercises;
drop table if exists public.plan_exercises;
