# FinStreet Marketing Hub — Setup & Go-Live

## 1. Database (one time)
Supabase > SQL Editor > New query > paste the whole of **RUN-THIS-IN-SUPABASE.sql** > Run.
(It contains schema_v2, v3, v4 and makes admin@finstreeteducation.com an admin. Never run the old schema.sql again.)

## 2. Run locally
```
npm install
npm run dev
```
Open http://localhost:3000

## 3. Go live on Vercel
1. Push the folder to a **private** GitHub repo.
2. vercel.com > Add New > Project > import the repo.
3. Add Environment Variables (copy from `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Click Deploy. You get a link like `https://marketing-hub.vercel.app`.
5. Supabase > Authentication > URL Configuration:
   - Site URL = your Vercel link
   - Redirect URLs = `https://<your-vercel-link>/**`

## 4. Invite the team (14 people)
- Share the link. Each person signs up with **their own name and work email** — that name appears on their tasks, chat and timers.
- Once everyone has joined: Supabase > Authentication > Sign In / Providers > turn **off** "Allow new users to sign up". Invite anyone new via Authentication > Users > Invite user.
- Roles: open **Team Overview** (admin only) and change a member to Manager from the dropdown.

## Roles
| Role | Can do |
|---|---|
| Member | Own tasks, chat, upload files, start/stop timer, see own hours |
| Manager | Everything above + Team Overview (everyone's tasks, live timers, hours), approve work, team time report |
| Admin | Everything above + change roles |

## Import & Export
Sidebar > Import & Export. Export tasks / time / full backup as Excel or CSV. To bulk-add tasks: download the template, fill it in, upload, review, click Import.

## Uploads
Supabase free plan: up to 50 MB per file. For full-length videos, paste a Google Drive / YouTube link in the task's Links tab, or upgrade to Supabase Pro and follow the note at the bottom of `schema_v3.sql`.

## Updating later
Edit code > `git push` > Vercel redeploys automatically.
