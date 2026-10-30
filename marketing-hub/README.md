# FinStreet Marketing Hub

The FinStreet marketing workspace: dashboard, spaces with monthly folders, board and list views,
task drawer (subtasks, checklist, files, Drive and video links, custom fields, comments, approvals),
start / stop timer and time reports, campaigns, video and podcast library, team chat (groups, DMs,
photos, videos, voice notes), team roles and invites, CSV import and export.

Stack: Next.js + Supabase (auth, database, storage, realtime) + Vercel.

## Setup
1. Supabase > SQL Editor: run `schema_v5.sql` once (after the earlier schema files).
2. Vercel environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. The first admin who logs in creates the FinStreet spaces automatically.

All app data lives in the `hub_docs` table; files live in the `task-files` storage bucket.
