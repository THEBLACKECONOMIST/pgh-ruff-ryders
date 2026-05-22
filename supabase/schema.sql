-- ============================================================
-- PITTSBURGH RUFF RYDERS — ATTENDANCE TRACKER
-- Run this entire file in Supabase → SQL Editor
-- ============================================================

-- Members table
create table if not exists members (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

-- Events table
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  month text not null,
  event_type text not null check (event_type in ('annual','beer_blast','bike_night')),
  created_at timestamptz default now()
);

-- Attendance table (junction)
create table if not exists attendance (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references members(id) on delete cascade not null,
  event_id uuid references events(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(member_id, event_id)
);

-- ── Enable Row Level Security ────────────────────────────
alter table members   enable row level security;
alter table events    enable row level security;
alter table attendance enable row level security;

-- ── Public read/write policies (no login required) ──────
create policy "public_all" on members   for all using (true) with check (true);
create policy "public_all" on events    for all using (true) with check (true);
create policy "public_all" on attendance for all using (true) with check (true);

-- ── Seed chapter roster ─────────────────────────────────
insert into members (name) values
  ('Divyne'),
  ('dmone Williams'),
  ('Dreadz'),
  ('Grrub PGH RR Prez'),
  ('Hooch By SIGMA'),
  ('JeRz Boi'),
  ('Juicy Jay'),
  ('Pittsburgh RR'),
  ('RR -Smiley'),
  ('RR Jeezy'),
  ('RR Jigga'),
  ('RR SPOOKY'),
  ('RR-Kaos'),
  ('RR Stogie'),
  ('ThRRoBred'),
  ('Vugatti-')
on conflict (name) do nothing;
