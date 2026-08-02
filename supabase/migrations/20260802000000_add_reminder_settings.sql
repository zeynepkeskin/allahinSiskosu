-- Per-user preferences for the in-browser evening logging reminder.
alter table public.profiles
  add column reminder_enabled boolean not null default false,
  add column reminder_time time not null default '20:00';

alter table public.profiles
  add constraint profiles_reminder_time_on_quarter_hour
  check (extract(minute from reminder_time) in (0, 15, 30, 45));
