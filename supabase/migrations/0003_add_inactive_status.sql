-- 0003_add_inactive_status.sql
-- Extends the `status` CHECK constraint on `properties` to allow the new
-- `inactive` value, which is used for soft-deleting properties.
-- An inactive property is hidden from the public-facing site but remains
-- visible in the admin panel so it can be reactivated later.
--
-- No Supabase CLI is linked in this repo. Apply manually via:
--   Supabase Dashboard -> your project -> SQL Editor -> New query -> paste
--   this entire file -> Run.
-- Safe to re-run: uses IF EXISTS / explicit drop + re-add pattern.

ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_status_check;

ALTER TABLE public.properties
  ADD CONSTRAINT properties_status_check
    CHECK (status IN ('active', 'pending', 'sold', 'inactive'));
