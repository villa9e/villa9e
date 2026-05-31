-- ============================================================
-- 033: Sprint completions — public verified wins system
-- ============================================================

-- Add completed_at to sprints if not present
alter table sprints add column if not exists completed_at timestamptz;

-- Make completed sprints publicly readable so villagers can see each other's wins
drop policy if exists "public read completed sprints" on sprints;
create policy "public read completed sprints" on sprints
  for select using (status = 'completed' or auth.uid() = user_id);

-- Sprint achievement definitions (upsert into achievements table)
insert into achievements (id, title, description, icon, rarity, points, category)
values
  ('first_sprint',    'First Sprint',     'Completed your first weekly sprint',         '⚡', 'common',    50,  'gps'),
  ('sprint_streak_4', 'Sprint Warrior',   'Completed 4 consecutive sprints',            '🔥', 'rare',      150, 'gps'),
  ('sprint_master',   'Sprint Master',    'Completed 10 total sprints',                 '🏆', 'epic',      400, 'gps'),
  ('sprint_legend',   'Sprint Legend',    'Completed 25 total sprints',                 '👑', 'legendary', 1000,'gps')
on conflict (id) do update
  set title       = excluded.title,
      description = excluded.description,
      icon        = excluded.icon,
      rarity      = excluded.rarity,
      points      = excluded.points,
      category    = excluded.category;
