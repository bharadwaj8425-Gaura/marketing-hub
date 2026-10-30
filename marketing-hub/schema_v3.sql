-- =====================================================================
-- Marketing Hub : v3 database update (Team page / roles)
-- Supabase > SQL Editor > New query > paste this whole file > Run
-- Run AFTER schema.sql and schema_v2.sql. Safe to run more than once.
-- =====================================================================

-- Admins can change a team member's role from the Team page.
create or replace function public.set_user_role(p_user uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if (select role from public.profiles where id = auth.uid()) is distinct from 'admin' then
    raise exception 'Only an admin can change roles';
  end if;
  if p_role not in ('admin', 'manager', 'member') then
    raise exception 'Invalid role';
  end if;
  if p_user = auth.uid() and p_role <> 'admin' then
    raise exception 'You cannot remove your own admin role';
  end if;
  update public.profiles set role = p_role where id = p_user;
end;
$$;

revoke all on function public.set_user_role(uuid, text) from public;
grant execute on function public.set_user_role(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- Make yourself admin (replace the email, run once):
-- update public.profiles set role = 'admin' where email = 'admin@finstreeteducation.com';
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- BIGGER VIDEO UPLOADS (only if you are on Supabase Pro plan)
-- Free plan is capped at 50 MB per file. On Pro, first raise the global limit in
-- Supabase > Storage > Settings, then run this (example: 1 GB) and set
-- NEXT_PUBLIC_MAX_UPLOAD_MB=1024 in Vercel environment variables.
-- update storage.buckets set file_size_limit = 1073741824 where id = 'task-files';
-- ---------------------------------------------------------------------
