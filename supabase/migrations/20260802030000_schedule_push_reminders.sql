-- Store the project URL and the same random REMINDER_CRON_SECRET used by the
-- Edge Function in Supabase Vault before this job first runs. The job invokes
-- the protected function on the hour without relying on Vercel Cron.
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
declare existing_job_id bigint;
begin
  select jobid into existing_job_id from cron.job where jobname = 'send-evening-reminders';
  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end;
$$;

select cron.schedule(
  'send-evening-reminders',
  '0 * * * *',
  $job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/send-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'reminder_cron_secret')
      ),
      body := '{}'::jsonb
    );
  $job$
);
