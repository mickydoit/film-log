-- Film Log schema.
-- This project is shared with four other apps; every object is film_-prefixed
-- and no pre-existing table or policy is touched.

create table if not exists public.film_rolls (
  id             uuid primary key default gen_random_uuid(),
  camera_id      text not null check (camera_id in ('olympus-xa', 'pentax-17')),
  film_stock     text not null,
  box_iso        integer not null check (box_iso between 6 and 6400),
  iso_set        integer not null check (iso_set between 6 and 6400),
  exposures      integer not null check (exposures between 1 and 40),
  frame_capacity integer not null check (frame_capacity between 1 and 80),
  status         text not null default 'shooting'
                 check (status in ('shooting', 'finished', 'developing', 'scanned')),
  loaded_at      timestamptz not null default now(),
  finished_at    timestamptz,
  lab            text,
  dev_notes      text,
  created_at     timestamptz not null default now()
);

create table if not exists public.film_shots (
  id           uuid primary key default gen_random_uuid(),
  roll_id      uuid not null references public.film_rolls(id) on delete cascade,
  frame_number integer not null check (frame_number > 0),
  settings     jsonb not null default '{}'::jsonb,
  light        text check (light in (
                 'bright-sun','hazy-sun','overcast','open-shade','indoors','night')),
  shot_at      timestamptz not null default now(),
  subject      text,
  scan_path    text,
  ai_critique  jsonb,
  my_notes     text,
  created_at   timestamptz not null default now(),
  unique (roll_id, frame_number)
);

-- No separate index on (roll_id, frame_number) here: the `unique (roll_id, frame_number)`
-- constraint above already creates an identical btree index
-- (film_shots_roll_id_frame_number_key), so a duplicate would only add write overhead.

create index if not exists film_rolls_status_idx
  on public.film_rolls (status, loaded_at desc);

alter table public.film_rolls enable row level security;
alter table public.film_shots enable row level security;

-- The app is gated by a shared passcode in the UI, not by Supabase auth.
-- These policies deliberately grant anon access, and are scoped to film_ tables
-- only. See the "Authentication" section of the spec for the accepted trade-off.
drop policy if exists film_rolls_anon_all on public.film_rolls;
create policy film_rolls_anon_all on public.film_rolls
  for all to anon using (true) with check (true);

drop policy if exists film_shots_anon_all on public.film_shots;
create policy film_shots_anon_all on public.film_shots
  for all to anon using (true) with check (true);
