-- =====================================================================
-- Marketing Hub : v4 database update
-- Adds: subtasks + checklist, time estimate, video & podcast library
-- Supabase > SQL Editor > New query > paste this whole file > Run
-- Run AFTER schema_v2.sql and schema_v3.sql. Safe to run more than once.
-- =====================================================================

-- 1. Estimate (hours) on tasks
alter table public.tasks add column if not exists est_hours numeric(6,1);

-- 2. Subtasks and checklist items
create table if not exists public.task_items (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  kind        text not null default 'subtask' check (kind in ('subtask','check')),
  title       text not null check (char_length(title) between 1 and 300),
  done        boolean not null default false,
  position    int not null default 0,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_task_items_task on public.task_items (task_id, kind, position);

alter table public.task_items enable row level security;
drop policy if exists "items_select" on public.task_items;
create policy "items_select" on public.task_items for select to authenticated using (true);
drop policy if exists "items_insert" on public.task_items;
create policy "items_insert" on public.task_items for insert to authenticated with check (created_by = auth.uid());
drop policy if exists "items_update" on public.task_items;
create policy "items_update" on public.task_items for update to authenticated using (true) with check (true);
drop policy if exists "items_delete" on public.task_items;
create policy "items_delete" on public.task_items for delete to authenticated
  using (created_by = auth.uid() or public.is_manager());
grant select, insert, update, delete on public.task_items to authenticated;

-- 3. Video & podcast library
create table if not exists public.videos (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references public.projects(id) on delete set null,
  task_id       uuid references public.tasks(id) on delete set null,
  title         text not null,
  code          text,                       -- e.g. "EP 42", "S2E8"
  guest         text,                       -- e.g. "Host only", "Anjali Rao, CFP"
  media         text not null default 'video' check (media in ('video','audio','shorts')),
  status        text not null default 'raw' check (status in ('raw','edited','final','published')),
  version       int not null default 1,
  length        text,                       -- "24:18" or "6 clips"
  publish_date  date,
  views         int,
  links         jsonb not null default '[]'::jsonb,  -- [{label, type, url}]
  file_path     text,                       -- optional upload in task-files bucket
  file_name     text,
  file_size     bigint,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_videos_project on public.videos (project_id, created_at desc);

alter table public.videos enable row level security;
drop policy if exists "videos_select" on public.videos;
create policy "videos_select" on public.videos for select to authenticated using (true);
drop policy if exists "videos_insert" on public.videos;
create policy "videos_insert" on public.videos for insert to authenticated with check (created_by = auth.uid());
drop policy if exists "videos_update" on public.videos;
create policy "videos_update" on public.videos for update to authenticated
  using (created_by = auth.uid() or public.is_manager()) with check (true);
drop policy if exists "videos_delete" on public.videos;
create policy "videos_delete" on public.videos for delete to authenticated
  using (created_by = auth.uid() or public.is_manager());
grant select, insert, update, delete on public.videos to authenticated;
