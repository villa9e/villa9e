-- Curated feed items: TikTok oEmbed + YouTube entries added by admins
CREATE TABLE IF NOT EXISTS curated_feed_items (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type    text        NOT NULL DEFAULT 'tiktok', -- 'tiktok' | 'youtube'
  source_url     text        NOT NULL,
  title          text,
  author_name    text,
  embed_html     text,       -- TikTok oEmbed blockquote HTML
  thumbnail_url  text,
  video_id       text,       -- YouTube video ID or TikTok video ID
  is_active      boolean     DEFAULT true,
  curated_by     uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  sort_order     integer     DEFAULT 0,
  view_count     integer     DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE curated_feed_items ENABLE ROW LEVEL SECURITY;

-- Public can read active items (needed for workshop feed, no auth required)
CREATE POLICY "curated_feed_public_read"
  ON curated_feed_items FOR SELECT
  USING (is_active = true);

-- Admins can do everything
CREATE POLICY "curated_feed_admin_all"
  ON curated_feed_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND (is_super_admin = true OR role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND (is_super_admin = true OR role = 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS curated_feed_sort_idx ON curated_feed_items (sort_order, created_at DESC);
