-- 0001_create_profiles.sql
-- Adds a profiles table (1 row per auth.users row) carrying the app-level role.
--
-- No Supabase CLI is linked in this repo. Apply this manually via:
--   Supabase Dashboard -> your project -> SQL Editor -> New query -> paste this
--   entire file -> Run.
--
-- IMPORTANT: statement order below is load-bearing. The backfill INSERT must
-- run before the seed UPDATE, otherwise the UPDATE finds zero matching rows
-- (silently no-ops) even though the target user already exists in auth.users.
-- Running this whole file as one paste executes it as a single sequential
-- script, which already guarantees the correct order -- do not split it up
-- and run the seed UPDATE on its own before the backfill has run at least once.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users may read only their own row. This is the ONLY policy on this table.
-- It exists so middleware / server components can cheaply check "am I admin?"
-- via the normal (anon/authenticated) client. There is deliberately no
-- insert/update/delete policy for authenticated/anon: granting admins the
-- ability to update arbitrary rows via RLS would require a self-referential
-- policy that queries `profiles` from within a `profiles` policy (the classic
-- RLS infinite-recursion footgun). Instead, all role changes go through the
-- service-role client (lib/supabase/admin.ts), which bypasses RLS entirely,
-- gated by an application-level admin check in the Server Action that calls it.
create policy "Profiles are viewable by owner"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- Auto-create a profiles row whenever a new auth.users row appears
-- (i.e. on every first OAuth sign-in going forward).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Backfill: the trigger above only fires on FUTURE auth.users inserts. This
-- app's OAuth login already existed before this migration was written, so
-- users (including the one seeded as admin below) may already have an
-- auth.users row with no matching profiles row yet. This MUST run before the
-- seed UPDATE below -- see the ordering note at the top of this file.
insert into public.profiles (id, email, full_name, avatar_url)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
from auth.users u
on conflict (id) do nothing;

-- Seed the first admin. No-ops (updates 0 rows) if this email hasn't signed
-- in at all yet (neither before this migration nor via the backfill above) --
-- in that case, sign in once via /login, then re-run just this UPDATE
-- statement from the Supabase Dashboard SQL Editor.
update public.profiles
set role = 'admin'
where email = 'franciscoagamez@gmail.com';
