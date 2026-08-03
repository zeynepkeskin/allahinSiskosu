alter table public.plan_exercises
add column set_duration_seconds smallint check (
  set_duration_seconds is null
  or set_duration_seconds between 1 and 7200
);
