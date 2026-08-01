alter table public.plan_exercises drop column weight_display;

alter table public.workout_session_exercises add column weight_lb numeric(7, 2) check (weight_lb is null or weight_lb >= 0);
update public.workout_session_exercises
set weight_lb = nullif(regexp_replace(weight_display, '[^0-9.]', '', 'g'), '')::numeric;
alter table public.workout_session_exercises drop column weight_display;
