set local lock_timeout = '5s';

delete from public.exercise_plans
where is_rest_day = true;

alter table public.exercise_plans
  drop column if exists is_rest_day;
