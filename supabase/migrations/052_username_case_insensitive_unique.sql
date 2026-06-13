-- Usernames are the user's profile domain (/[username]) and must be unique
-- sitewide regardless of case. The existing profiles_username_key is a
-- case-sensitive UNIQUE(username); add a case-insensitive unique index too
-- so "JohnDoe" and "johndoe" can't both exist.
create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));
