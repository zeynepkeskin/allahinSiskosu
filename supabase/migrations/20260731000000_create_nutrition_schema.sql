create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  date_of_birth date,
  height_cm numeric(5, 2) check (height_cm is null or height_cm > 0),
  sex text check (sex is null or sex in ('female', 'male', 'other', 'prefer_not_to_say')),
  activity_level text check (activity_level is null or activity_level in ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active')),
  calorie_goal integer check (calorie_goal is null or calorie_goal > 0),
  protein_goal_g numeric(7, 2) check (protein_goal_g is null or protein_goal_g >= 0),
  carbs_goal_g numeric(7, 2) check (carbs_goal_g is null or carbs_goal_g >= 0),
  fat_goal_g numeric(7, 2) check (fat_goal_g is null or fat_goal_g >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  eaten_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  serving text not null check (char_length(trim(serving)) > 0),
  calories integer not null check (calories >= 0),
  protein_g numeric(7, 2) not null check (protein_g >= 0),
  carbs_g numeric(7, 2) not null check (carbs_g >= 0),
  fat_g numeric(7, 2) not null check (fat_g >= 0),
  created_at timestamptz not null default now()
);

create table public.daily_weights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recorded_on date not null default current_date,
  weight_kg numeric(6, 2) not null check (weight_kg > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, recorded_on)
);

create index meals_user_id_eaten_at_idx on public.meals (user_id, eaten_at desc);
create index meal_items_meal_id_idx on public.meal_items (meal_id);
create index daily_weights_user_id_recorded_on_idx on public.daily_weights (user_id, recorded_on desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create trigger meals_set_updated_at before update on public.meals
for each row execute function public.set_updated_at();

create trigger daily_weights_set_updated_at before update on public.daily_weights
for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.meals enable row level security;
alter table public.meal_items enable row level security;
alter table public.daily_weights enable row level security;

create policy "Users can manage their own profile" on public.profiles
for all to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can manage their own meals" on public.meals
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can manage items in their own meals" on public.meal_items
for all to authenticated
using (
  exists (
    select 1 from public.meals
    where meals.id = meal_items.meal_id
      and meals.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.meals
    where meals.id = meal_items.meal_id
      and meals.user_id = (select auth.uid())
  )
);

create policy "Users can manage their own weight entries" on public.daily_weights
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
