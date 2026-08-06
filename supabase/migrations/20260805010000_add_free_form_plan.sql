alter table public.exercise_plans
  add column if not exists plan_type text not null default 'scheduled'
  check (plan_type in ('scheduled', 'free_form'));

alter table public.exercise_plans alter column day_of_week drop not null;
alter table public.exercise_plans drop constraint if exists exercise_plans_day_of_week_check;
alter table public.exercise_plans add constraint exercise_plans_day_of_week_check check (
  (plan_type = 'scheduled' and day_of_week between 0 and 6)
  or (plan_type = 'free_form' and day_of_week is null)
);

alter table public.exercise_plans
  drop constraint if exists exercise_plans_profile_id_day_of_week_key;

create unique index if not exists exercise_plans_profile_scheduled_day_idx
on public.exercise_plans (profile_id, day_of_week)
where plan_type = 'scheduled';

create unique index if not exists exercise_plans_profile_free_form_idx
on public.exercise_plans (profile_id)
where plan_type = 'free_form';

drop trigger if exists workout_sessions_one_per_user_day on public.workout_sessions;
drop function if exists public.ensure_one_workout_session_per_user_day();

create unique index if not exists workout_sessions_plan_date_idx
on public.workout_sessions (exercise_plan_id, workout_date);
