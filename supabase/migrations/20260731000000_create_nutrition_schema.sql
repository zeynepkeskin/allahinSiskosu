-- Phase 1 core nutrition schema. Apply with `supabase db push` or in the SQL editor.

create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  email text not null unique,
  height_cm numeric(5, 2) check (height_cm is null or height_cm > 0),
  weight_kg numeric(6, 2) check (weight_kg is null or weight_kg > 0),
  target_weight numeric(6, 2) check (target_weight is null or target_weight > 0),
  birthday date,
  gender text check (gender is null or gender in ('female', 'male', 'non_binary', 'prefer_not_to_say')),
  activity_level text check (activity_level is null or activity_level in ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active')),
  goal text check (goal is null or goal in ('lose', 'maintain', 'gain')),
  daily_calorie_goal integer check (daily_calorie_goal is null or daily_calorie_goal > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  meal_name text not null check (char_length(trim(meal_name)) > 0),
  meal_time timestamptz not null default now(),
  total_calories integer not null check (total_calories >= 0),
  protein numeric(7, 2) not null default 0 check (protein >= 0),
  carbs numeric(7, 2) not null default 0 check (carbs >= 0),
  fat numeric(7, 2) not null default 0 check (fat >= 0),
  fiber numeric(7, 2) not null default 0 check (fiber >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals (id) on delete cascade,
  food_name text not null check (char_length(trim(food_name)) > 0),
  serving text not null check (char_length(trim(serving)) > 0),
  calories integer not null check (calories >= 0),
  protein numeric(7, 2) not null default 0 check (protein >= 0),
  carbs numeric(7, 2) not null default 0 check (carbs >= 0),
  fat numeric(7, 2) not null default 0 check (fat >= 0),
  fiber numeric(7, 2) not null default 0 check (fiber >= 0),
  sugar numeric(7, 2) not null default 0 check (sugar >= 0),
  confidence numeric(4, 3) check (confidence is null or confidence between 0 and 1),
  created_at timestamptz not null default now()
);

create table public.daily_weights (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  weight numeric(6, 2) not null check (weight > 0),
  date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, date)
);

create index meals_profile_id_meal_time_idx on public.meals (profile_id, meal_time desc);
create index meal_items_meal_id_idx on public.meal_items (meal_id);
create index daily_weights_profile_id_date_idx on public.daily_weights (profile_id, date desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger meals_set_updated_at before update on public.meals for each row execute function public.set_updated_at();
create trigger daily_weights_set_updated_at before update on public.daily_weights for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username, email)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'username'), ''), new.email);
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.meals enable row level security;
alter table public.meal_items enable row level security;
alter table public.daily_weights enable row level security;

create policy "Users manage their own profile" on public.profiles for all to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Users manage their own meals" on public.meals for all to authenticated
using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
create policy "Users manage items in their own meals" on public.meal_items for all to authenticated
using (exists (select 1 from public.meals where meals.id = meal_items.meal_id and meals.profile_id = (select auth.uid())))
with check (exists (select 1 from public.meals where meals.id = meal_items.meal_id and meals.profile_id = (select auth.uid())));
create policy "Users manage their own weight entries" on public.daily_weights for all to authenticated
using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
