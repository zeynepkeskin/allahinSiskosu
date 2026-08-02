-- Vercel's hourly cron schedule can only deliver reminders reliably on the
-- hour. Replace the earlier quarter-hour preference constraint accordingly.
alter table public.profiles
  drop constraint if exists profiles_reminder_time_on_quarter_hour;

-- Preserve valid existing preferences by moving quarter-hour choices to the
-- start of their selected hour before enforcing the new schedule.
update public.profiles
  set reminder_time = make_time(extract(hour from reminder_time)::integer, 0, 0)
  where extract(minute from reminder_time) <> 0;

alter table public.profiles
  add constraint profiles_reminder_time_on_the_hour
  check (extract(minute from reminder_time) = 0);
