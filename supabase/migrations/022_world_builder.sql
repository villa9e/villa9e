-- ─── Extended world object fields for the full world builder ─────────────────
alter table admin_world_objects
  add column if not exists tint_color          text,
  add column if not exists emissive_color      text,
  add column if not exists opacity             float   not null default 1.0,
  add column if not exists elevation           float   not null default 0,
  add column if not exists linked_page         text,
  add column if not exists linked_feature      text,
  add column if not exists behavior            text    not null default 'none'
    check (behavior in ('none','page','iframe','transport','dialog','sound_zone')),
  add column if not exists dialog_title        text,
  add column if not exists dialog_content      text,
  add column if not exists iframe_url          text,
  add column if not exists transport_target    text,
  add column if not exists sound_url           text,
  add column if not exists sound_volume        float   not null default 0.7,
  add column if not exists sound_trigger_dist  float   not null default 15,
  add column if not exists sound_max_dist      float   not null default 4,
  add column if not exists sound_loop          boolean not null default true,
  add column if not exists is_building         boolean not null default false,
  add column if not exists trail_enabled       boolean not null default false,
  add column if not exists trail_passable      boolean not null default true,
  add column if not exists trail_points        jsonb   not null default '[]',
  add column if not exists world_name          text,
  add column if not exists sort_order          integer not null default 0;

-- Index for map queries (buildings + live)
create index if not exists idx_world_obj_building on admin_world_objects(is_building, is_live);
create index if not exists idx_world_obj_sort     on admin_world_objects(sort_order);
