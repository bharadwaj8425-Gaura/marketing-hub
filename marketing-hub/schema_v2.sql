-- =====================================================================
-- Marketing Task Manager : STEP 5 database update
-- Supabase > SQL Editor > New query > paste this whole file > Run
-- (schema.sql pehle run ho chuka hona chahiye. Ye file dobara run karna safe hai.)
--
-- Adds: monthly folders, review/approval workflow, activity log,
--       video/Drive links, file uploads (storage), start/stop timer,
--       group chat (realtime)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. MONTHLY FOLDERS  (inside each space)
-- ---------------------------------------------------------------------
create table if not exists public.folders (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  name        text not null,
  month       date not null,                       -- always the 1st of the month
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (project_id, month)
);
create index if not exists idx_folders_project on public.folders (project_id, month desc);

-- ---------------------------------------------------------------------
-- 2. NEW TASK COLUMNS
-- ---------------------------------------------------------------------
alter table public.tasks add column if not exists folder_id    uuid references public.folders(id) on delete set null;
alter table public.tasks add column if not exists reviewer_id  uuid references public.profiles(id) on delete set null;
alter table public.tasks add column if not exists content_type text;
create index if not exists idx_tasks_folder   on public.tasks (folder_id);
create index if not exists idx_tasks_reviewer on public.tasks (reviewer_id);

-- ---------------------------------------------------------------------
-- 3. STATUS WORKFLOW
--    To Do > In Progress > Review Required > Changes Required > Approved
--    > Completed (stored as 'done'), plus On Hold
-- ---------------------------------------------------------------------
alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks add constraint tasks_status_check
  check (status in ('todo','in_progress','review','changes_required','approved','done','on_hold'));

-- Reviewer can also edit the task (to approve / request changes).
-- WITH CHECK (true) so an assignee can hand the task over to someone else.
drop policy if exists "tasks_update" on public.tasks;
create policy "tasks_update" on public.tasks
  for update to authenticated
  using (public.is_manager() or assignee_id = auth.uid()
         or created_by = auth.uid() or reviewer_id = auth.uid())
  with check (true);

-- Only the reviewer or a manager can set Approved / Changes Required
create or replace function public.tasks_enforce_status_rules()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('approved','changes_required')
     and (tg_op = 'INSERT' or new.status is distinct from old.status)
     and auth.uid() is not null then
    if not (public.is_manager()
            or (tg_op = 'UPDATE' and old.reviewer_id = auth.uid())) then
      raise exception 'Only the reviewer or a manager can set this status';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tasks_status_rules on public.tasks;
create trigger trg_tasks_status_rules
  before insert or update on public.tasks
  for each row execute function public.tasks_enforce_status_rules();

-- ---------------------------------------------------------------------
-- 4. ACTIVITY LOG  (every status / assignee / reviewer / due-date change)
-- ---------------------------------------------------------------------
create table if not exists public.task_activity (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null,
  action      text not null,       -- created | status | assignee | reviewer | due_date
  detail      text,                -- "old>new"
  created_at  timestamptz not null default now()
);
create index if not exists idx_activity_task on public.task_activity (task_id, created_at desc);

create or replace function public.tasks_log_changes()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  actor    uuid := auth.uid();
  old_name text;
  new_name text;
begin
  if tg_op = 'INSERT' then
    insert into public.task_activity (task_id, user_id, action) values (new.id, actor, 'created');
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.task_activity (task_id, user_id, action, detail)
    values (new.id, actor, 'status', old.status || '>' || new.status);

    if new.assignee_id is not null and new.assignee_id is distinct from actor then
      insert into public.notifications (user_id, task_id, type, message)
      values (new.assignee_id, new.id, 'status',
              'Status: ' || replace(new.status, '_', ' ') || ' - ' || new.title);
    end if;

    if new.reviewer_id is not null
       and new.reviewer_id is distinct from actor
       and new.reviewer_id is distinct from new.assignee_id then
      insert into public.notifications (user_id, task_id, type, message)
      values (new.reviewer_id, new.id,
              case when new.status = 'review' then 'review' else 'status' end,
              case when new.status = 'review'
                   then 'Approval needed: ' || new.title
                   else 'Status: ' || replace(new.status, '_', ' ') || ' - ' || new.title end);
    end if;
  end if;

  if new.assignee_id is distinct from old.assignee_id then
    select coalesce(full_name, email) into old_name from public.profiles where id = old.assignee_id;
    select coalesce(full_name, email) into new_name from public.profiles where id = new.assignee_id;
    insert into public.task_activity (task_id, user_id, action, detail)
    values (new.id, actor, 'assignee', coalesce(old_name, 'nobody') || '>' || coalesce(new_name, 'nobody'));
  end if;

  if new.reviewer_id is distinct from old.reviewer_id then
    select coalesce(full_name, email) into old_name from public.profiles where id = old.reviewer_id;
    select coalesce(full_name, email) into new_name from public.profiles where id = new.reviewer_id;
    insert into public.task_activity (task_id, user_id, action, detail)
    values (new.id, actor, 'reviewer', coalesce(old_name, 'nobody') || '>' || coalesce(new_name, 'nobody'));
  end if;

  if new.due_date is distinct from old.due_date then
    insert into public.task_activity (task_id, user_id, action, detail)
    values (new.id, actor, 'due_date',
            coalesce(old.due_date::text, 'none') || '>' || coalesce(new.due_date::text, 'none'));
  end if;

  return new;
end;
$$;

drop trigger if exists trg_tasks_log_changes on public.tasks;
create trigger trg_tasks_log_changes
  after insert or update on public.tasks
  for each row execute function public.tasks_log_changes();

-- ---------------------------------------------------------------------
-- 5. VIDEO / DRIVE / OTHER LINKS ON TASKS
-- ---------------------------------------------------------------------
create table if not exists public.task_links (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  label       text not null,
  kind        text not null default 'other',   -- youtube, drive, vimeo, podcast, raw, thumbnail, script, other
  url         text not null check (url ~* '^https?://'),
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_links_task on public.task_links (task_id);

-- ---------------------------------------------------------------------
-- 6. FILE UPLOADS  (metadata table + private storage bucket)
-- ---------------------------------------------------------------------
create table if not exists public.task_files (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references public.tasks(id) on delete cascade,
  name         text not null,
  path         text not null,
  size_bytes   bigint,
  mime         text,
  uploaded_by  uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_files_task on public.task_files (task_id);

-- 50 MB per file (free plan ki limit). Bade videos ke liye Drive link use karo.
insert into storage.buckets (id, name, public, file_size_limit)
values ('task-files', 'task-files', false, 52428800)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

drop policy if exists "task_files_storage_select" on storage.objects;
create policy "task_files_storage_select" on storage.objects
  for select to authenticated using (bucket_id = 'task-files');
drop policy if exists "task_files_storage_insert" on storage.objects;
create policy "task_files_storage_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'task-files');
drop policy if exists "task_files_storage_delete" on storage.objects;
create policy "task_files_storage_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'task-files');

-- ---------------------------------------------------------------------
-- 7. TIMER FUNCTIONS  (server time is used, so clocks can never disagree)
-- ---------------------------------------------------------------------
create or replace function public.start_timer(p_task uuid)
returns uuid language plpgsql security invoker set search_path = public as $$
declare
  new_id uuid;
begin
  update public.time_entries
     set ended_at = now()
   where user_id = auth.uid() and ended_at is null;

  insert into public.time_entries (task_id, user_id)
  values (p_task, auth.uid())
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.stop_timer()
returns void language plpgsql security invoker set search_path = public as $$
begin
  update public.time_entries
     set ended_at = now()
   where user_id = auth.uid() and ended_at is null;
end;
$$;

-- ---------------------------------------------------------------------
-- 8. GROUP CHAT  (one channel per space + a General channel)
-- ---------------------------------------------------------------------
create table if not exists public.chat_channels (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references public.projects(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);
create unique index if not exists uq_chat_channel_project
  on public.chat_channels (project_id) where project_id is not null;

create table if not exists public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  channel_id  uuid not null references public.chat_channels(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 4000),
  created_at  timestamptz not null default now()
);
create index if not exists idx_chat_messages on public.chat_messages (channel_id, created_at desc);

-- General channel + a channel for every existing space
insert into public.chat_channels (name)
select 'General'
where not exists (select 1 from public.chat_channels where project_id is null and name = 'General');

insert into public.chat_channels (project_id, name)
select p.id, p.name from public.projects p
where not exists (select 1 from public.chat_channels c where c.project_id = p.id);

-- Every new space gets its own channel automatically
create or replace function public.create_project_channel()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.chat_channels (project_id, name) values (new.id, new.name);
  return new;
end;
$$;

drop trigger if exists trg_project_channel on public.projects;
create trigger trg_project_channel
  after insert on public.projects
  for each row execute function public.create_project_channel();

-- Realtime: new messages show up instantly for everyone
do $$
begin
  begin
    alter publication supabase_realtime add table public.chat_messages;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;

-- =====================================================================
-- SECURITY (Row Level Security) for the new tables
-- =====================================================================
alter table public.folders        enable row level security;
alter table public.task_activity  enable row level security;
alter table public.task_links     enable row level security;
alter table public.task_files     enable row level security;
alter table public.chat_channels  enable row level security;
alter table public.chat_messages  enable row level security;

-- FOLDERS: everyone sees, anyone can create (as themselves), only managers edit/delete
drop policy if exists "folders_select" on public.folders;
create policy "folders_select" on public.folders for select to authenticated using (true);
drop policy if exists "folders_insert" on public.folders;
create policy "folders_insert" on public.folders for insert to authenticated with check (created_by = auth.uid());
drop policy if exists "folders_update" on public.folders;
create policy "folders_update" on public.folders for update to authenticated using (public.is_manager());
drop policy if exists "folders_delete" on public.folders;
create policy "folders_delete" on public.folders for delete to authenticated using (public.is_manager());

-- ACTIVITY: read only (written by triggers)
drop policy if exists "activity_select" on public.task_activity;
create policy "activity_select" on public.task_activity for select to authenticated using (true);

-- LINKS
drop policy if exists "links_select" on public.task_links;
create policy "links_select" on public.task_links for select to authenticated using (true);
drop policy if exists "links_insert" on public.task_links;
create policy "links_insert" on public.task_links for insert to authenticated with check (created_by = auth.uid());
drop policy if exists "links_delete" on public.task_links;
create policy "links_delete" on public.task_links for delete to authenticated
  using (created_by = auth.uid() or public.is_manager());

-- FILES
drop policy if exists "files_select" on public.task_files;
create policy "files_select" on public.task_files for select to authenticated using (true);
drop policy if exists "files_insert" on public.task_files;
create policy "files_insert" on public.task_files for insert to authenticated with check (uploaded_by = auth.uid());
drop policy if exists "files_delete" on public.task_files;
create policy "files_delete" on public.task_files for delete to authenticated
  using (uploaded_by = auth.uid() or public.is_manager());

-- CHAT
drop policy if exists "channels_select" on public.chat_channels;
create policy "channels_select" on public.chat_channels for select to authenticated using (true);
drop policy if exists "channels_manage" on public.chat_channels;
create policy "channels_manage" on public.chat_channels for all to authenticated
  using (public.is_manager()) with check (public.is_manager());

drop policy if exists "messages_select" on public.chat_messages;
create policy "messages_select" on public.chat_messages for select to authenticated using (true);
drop policy if exists "messages_insert" on public.chat_messages;
create policy "messages_insert" on public.chat_messages for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "messages_delete" on public.chat_messages;
create policy "messages_delete" on public.chat_messages for delete to authenticated
  using (user_id = auth.uid() or public.is_manager());

-- ---------------------------------------------------------------------
-- GRANTS (so the app can reach the new tables and functions)
-- ---------------------------------------------------------------------
grant select, insert, update, delete on public.folders        to authenticated;
grant select                         on public.task_activity  to authenticated;
grant select, insert, delete         on public.task_links     to authenticated;
grant select, insert, delete         on public.task_files     to authenticated;
grant select, insert, update, delete on public.chat_channels  to authenticated;
grant select, insert, delete         on public.chat_messages  to authenticated;
grant execute on function public.start_timer(uuid) to authenticated;
grant execute on function public.stop_timer()      to authenticated;
