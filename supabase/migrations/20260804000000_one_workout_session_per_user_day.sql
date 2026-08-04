delete from public.workout_sessions;

alter table public.workout_sessions
  add column if not exists workout_date date not null default current_date;

alter table public.workout_sessions
  alter column workout_date drop default;

create or replace function public.ensure_one_workout_session_per_user_day()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  session_profile_id uuid;
begin
  select profile_id
  into session_profile_id
  from public.exercise_plans
  where id = new.exercise_plan_id;

  perform pg_advisory_xact_lock(hashtextextended(session_profile_id::text, 0));

  if exists (
    select 1
    from public.workout_sessions as session
    join public.exercise_plans as plan on plan.id = session.exercise_plan_id
    where plan.profile_id = session_profile_id
      and session.workout_date = new.workout_date
      and session.id is distinct from new.id
  ) then
    raise exception 'A workout session already exists for this user and date'
      using errcode = '23505';
  end if;

  return new;
end;
$$;

create trigger workout_sessions_one_per_user_day
before insert or update of exercise_plan_id, workout_date on public.workout_sessions
for each row execute function public.ensure_one_workout_session_per_user_day();
