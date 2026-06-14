-- ============================================================
-- Migration 055: studio-videos storage bucket + policies
-- ============================================================
-- Creates the storage bucket Creator Studio uploads (and admin-seeded
-- content) write to, referenced by studio_videos.video_url /
-- thumbnail_url. Bucket itself must also be created via the Storage API
-- (this file documents/re-applies the policies; the bucket row is
-- created with `insert ... on conflict do nothing` so this migration
-- is replayable).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('studio-videos', 'studio-videos', true, 52428800,
  array['video/mp4','video/quicktime','video/webm','image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "studio-videos public read" on storage.objects;
create policy "studio-videos public read"
  on storage.objects for select
  to public
  using (bucket_id = 'studio-videos');

drop policy if exists "studio-videos authenticated upload" on storage.objects;
create policy "studio-videos authenticated upload"
  on storage.objects for insert
  to public
  with check (
    bucket_id = 'studio-videos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "studio-videos authenticated update" on storage.objects;
create policy "studio-videos authenticated update"
  on storage.objects for update
  to public
  using (
    bucket_id = 'studio-videos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "studio-videos authenticated delete" on storage.objects;
create policy "studio-videos authenticated delete"
  on storage.objects for delete
  to public
  using (
    bucket_id = 'studio-videos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
