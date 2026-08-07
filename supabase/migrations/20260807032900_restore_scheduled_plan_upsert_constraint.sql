-- A regular unique constraint is required by the scheduled-plan PostgREST
-- upsert (`onConflict: "profile_id,day_of_week"`). PostgreSQL unique
-- constraints still allow multiple NULL day values, while the separate
-- free-form partial index continues to enforce one free-form plan per user.
drop index if exists public.exercise_plans_profile_scheduled_day_idx;

alter table public.exercise_plans
  add constraint exercise_plans_profile_id_day_of_week_key
  unique (profile_id, day_of_week);
