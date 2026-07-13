-- 0002_extend_properties_for_admin_form.sql
-- Extends `properties` with fields needed by the admin add/edit property
-- form (year built, parking spaces, amenities, listing status), and
-- provisions the public Storage bucket used for gallery image uploads.
--
-- No Supabase CLI is linked in this repo. Apply manually via:
--   Supabase Dashboard -> your project -> SQL Editor -> New query -> paste
--   this entire file -> Run.
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / ON CONFLICT).

alter table public.properties
  add column if not exists parking smallint not null default 0,
  add column if not exists year_built smallint,
  add column if not exists amenities text[] not null default '{}',
  add column if not exists status text not null default 'active'
    check (status in ('active', 'pending', 'sold'));

-- Public bucket for property gallery images. `public = true` serves objects
-- via the `/object/public/...` URL without needing an RLS SELECT policy.
-- All writes (upload/delete) go through the service-role client
-- (lib/supabase/admin.ts) from Server Actions gated by an application-level
-- admin check -- same pattern as profiles role changes -- so no
-- storage.objects INSERT/UPDATE/DELETE policies are required either.
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;
