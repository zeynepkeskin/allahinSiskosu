alter table public.profiles
  add column available_equipment text[] not null default '{}'::text[]
  constraint profiles_available_equipment_limit_check
    check (cardinality(available_equipment) <= 50)
  constraint profiles_available_equipment_no_nulls_check
    check (array_position(available_equipment, null) is null);

create table public.coach_conversations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'New conversation'
    check (char_length(trim(title)) between 1 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.coach_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null default '',
  status text not null default 'completed'
    check (status in ('pending', 'streaming', 'completed', 'failed', 'cancelled')),
  provider_response_id text,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create table public.coach_tool_runs (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.coach_conversations (id) on delete cascade,
  message_id uuid references public.coach_messages (id) on delete set null,
  tool_name text not null check (char_length(trim(tool_name)) between 1 and 100),
  arguments jsonb not null default '{}'::jsonb
    check (jsonb_typeof(arguments) = 'object'),
  result_summary jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed', 'cancelled')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (result_summary is null or jsonb_typeof(result_summary) in ('object', 'array', 'string', 'number', 'boolean'))
);

create index coach_conversations_profile_updated_idx
  on public.coach_conversations (profile_id, updated_at desc);
create index coach_messages_conversation_created_idx
  on public.coach_messages (conversation_id, created_at, id);
create index coach_tool_runs_conversation_created_idx
  on public.coach_tool_runs (conversation_id, created_at desc);
create index coach_tool_runs_message_idx
  on public.coach_tool_runs (message_id)
  where message_id is not null;

create trigger coach_conversations_set_updated_at
before update on public.coach_conversations
for each row execute function public.set_updated_at();

create trigger coach_tool_runs_set_updated_at
before update on public.coach_tool_runs
for each row execute function public.set_updated_at();

alter table public.coach_conversations enable row level security;
alter table public.coach_messages enable row level security;
alter table public.coach_tool_runs enable row level security;

create policy "Users manage their own coach conversations"
on public.coach_conversations for all to authenticated
using ((select auth.uid()) = profile_id)
with check ((select auth.uid()) = profile_id);

create policy "Users manage messages in their own coach conversations"
on public.coach_messages for all to authenticated
using (
  exists (
    select 1
    from public.coach_conversations
    where coach_conversations.id = coach_messages.conversation_id
      and coach_conversations.profile_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.coach_conversations
    where coach_conversations.id = coach_messages.conversation_id
      and coach_conversations.profile_id = (select auth.uid())
  )
);

create policy "Users manage tool runs in their own coach conversations"
on public.coach_tool_runs for all to authenticated
using (
  exists (
    select 1
    from public.coach_conversations
    where coach_conversations.id = coach_tool_runs.conversation_id
      and coach_conversations.profile_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.coach_conversations
    where coach_conversations.id = coach_tool_runs.conversation_id
      and coach_conversations.profile_id = (select auth.uid())
  )
);

grant select, insert, update, delete on table public.coach_conversations to authenticated;
grant select, insert, update, delete on table public.coach_messages to authenticated;
grant select, insert, update, delete on table public.coach_tool_runs to authenticated;
