alter table public.workout_sessions
  add column if not exists estimated_cal_burned integer
  check (estimated_cal_burned is null or estimated_cal_burned >= 0);
