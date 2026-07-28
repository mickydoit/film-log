-- Records the film-scans storage bucket and its access policy, applied alongside
-- the film_log migration (20260727000000) via execute_sql rather than a migration
-- file at the time. This file is a record of what was already applied — the
-- INSERT is idempotent (on conflict do nothing) and this file is not being
-- re-run to change state, only to make the migration history match reality.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('film-scans', 'film-scans', false, 26214400,
        array['image/jpeg','image/png','image/webp','image/tiff'])
on conflict (id) do nothing;

drop policy if exists film_scans_anon_all on storage.objects;
create policy film_scans_anon_all on storage.objects
  for all to anon
  using (bucket_id = 'film-scans')
  with check (bucket_id = 'film-scans');
