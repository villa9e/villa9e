-- Add trigger_type and item_info fields to admin_world_objects
alter table admin_world_objects
  add column if not exists trigger_type  text not null default 'click'
    check (trigger_type in ('click', 'approach', 'both')),
  add column if not exists trigger_distance float not null default 5,
  add column if not exists item_info_enabled boolean not null default false;
  -- item_info uses Spirit API to describe the real-world item (e.g., "A maple tree is...")
