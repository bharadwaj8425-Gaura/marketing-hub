create table if not exists public.hub_docs (
  kind text not null,
  id text not null,
  doc jsonb not null default '{}'::jsonb,
  updated_by uuid,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (kind, id)
);
create index if not exists idx_hub_kind on public.hub_docs (kind, created_at desc);
alter table public.hub_docs replica identity full;
alter table public.hub_docs enable row level security;
drop policy if exists "hub_all" on public.hub_docs;
create policy "hub_all" on public.hub_docs for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.hub_docs to authenticated;

create or replace function public.hub_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  is_admin boolean;
  inv jsonb;
begin
  select coalesce(p.role = 'admin', false) or exists (
    select 1 from hub_docs d where d.kind = 'member' and d.id = auth.uid()::text and d.doc->>'role' = 'admin')
  into is_admin from profiles p where p.id = auth.uid();
  is_admin := coalesce(is_admin, false);
  if tg_op = 'DELETE' then
    if old.kind = 'member' and not is_admin then raise exception 'Only an admin can remove members'; end if;
    return old;
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  if new.kind = 'member' and not is_admin then
    if new.id <> auth.uid()::text then raise exception 'Only an admin can change other members'; end if;
    if tg_op = 'UPDATE' then
      new.doc := new.doc || jsonb_build_object('role', old.doc->'role', 'sp', old.doc->'sp', 'active', old.doc->'active');
    else
      select doc into inv from hub_docs where kind = 'invite' and lower(doc->>'email') = lower(auth.email()) limit 1;
      new.doc := new.doc || jsonb_build_object(
        'role', coalesce(inv->>'role', (select case when role = 'manager' then 'manager' else 'member' end from profiles where id = auth.uid()), 'member'),
        'sp', coalesce(inv->'sp', '"all"'::jsonb),
        'active', true);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_hub_guard on public.hub_docs;
create trigger trg_hub_guard before insert or update or delete on public.hub_docs
  for each row execute function public.hub_guard();

do $$ begin
  begin alter publication supabase_realtime add table public.hub_docs;
  exception when duplicate_object then null; when undefined_object then null; end;
end $$;
