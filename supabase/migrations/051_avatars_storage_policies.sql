-- The "avatars" bucket exists but has no RLS policies, so all uploads fail
-- (storage.objects defaults to deny). Allow each authenticated user to
-- upload/overwrite only within their own "<user.id>/..." folder, and allow
-- public read (the bucket is public, route via getPublicUrl()).

create policy "avatars authenticated upload"
  on storage.objects for insert
  to public
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars authenticated update"
  on storage.objects for update
  to public
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars public read"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');
