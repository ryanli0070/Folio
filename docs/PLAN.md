# Folio v1 plan

## Phases
- [x] 0 Plan: CLAUDE.md, PLAN.md, HANDOFF.md
- [x] 1 Foundation: scaffold, Tailwind/shadcn, Primer tokens, app shell, schema + migrations, Auth.js, profile-on-signup, contracts (queries, types, limits, storage interface, MediaUploader props)
- [x] 2 Features (3 subagents): A Profile · B Projects · C Media
- [x] 3 Integration: pin + dnd reorder, empty/loading/error states, 404s, OG metadata, mobile pass, manual walkthrough
- [x] 4 Deploy readiness: SETUP.md (Vercel, OAuth callback, R2 CORS, migrations), final build

## Data model
- `user`, `account`, `session`, `verificationToken`: Auth.js Drizzle adapter tables.
- `profile` (1:1 user): userId PK/FK, username unique, displayName, bio, school, avatarKey (R2, nullable; fallback user.image), githubUrl, linkedinUrl, xUrl, websiteUrl, email, resumeUrl, skills text[], openToWork bool, timestamps.
- `project`: id uuid, userId FK, slug (unique per user), title, tagline, description (md), stack text[], collaborators text[], pinned bool, pinPosition int nullable, createdAt, updatedAt.
- `project_link`: id, projectId FK cascade, label, url, position.
- `project_media`: id, projectId FK cascade, key (R2), kind image|video, contentType, size, position, isCover bool.
- `upload` is not a table: presign → browser PUT → confirm HEADs object then inserts row.

## Decisions
- Auth.js v5 (`next-auth@beta`): v4 is the only "stable" tag but v5 is the App Router / `@auth/drizzle-adapter` line; beta used deliberately.
- Neon via `@neondatabase/serverless` HTTP driver + `drizzle-orm/neon-http` (no transactions; ordering writes use batched statements).
- Profile row created in Auth.js `events.createUser`; username = GitHub login lowercased/sanitized, suffixed `-2`, `-3`… on collision or reserved.
- Committing directly to `main` (greenfield repo, owner asked for frequent commits).
- Media can only be added to a saved project: `/dashboard/projects/new` creates the project, then redirects to its edit page where `<MediaUploader>` appears.
- Upload API: `POST /api/uploads/presign` and `POST /api/uploads/confirm` (contract in `lib/storage/client.ts`); avatar confirm also updates `profile.avatarKey` and deletes the old object.
- No `proxy.ts`: DB sessions can't be checked cheaply at the edge; `app/dashboard/layout.tsx` calls `requireUser()` and every action re-checks.
- Buttons/tokens restyled in place (`components/ui/button.tsx`, `app/globals.css`); brand mark is a plain "F" tile.
- Unconfirmed uploads (presigned but never confirmed) can leave orphan R2 objects; acceptable for v1, fix later with an R2 lifecycle rule on `users/` or a cleanup job.
- Presigned PUTs sign `content-type` and `content-length` (`signableHeaders`), so R2 rejects mismatched uploads; confirm still HEADs and re-validates.
- Only images can be a project cover (OG image); videos never become cover.
- lucide has no brand icons: GitHub links use `Terminal`, Devpost `Trophy`, YouTube `PlayCircle`, fallback `Globe`.
- Subagents worked in git worktrees on separate branches, merged with `--no-ff`.
- Pinning: `lib/actions/pins.ts`; new pins go to max(position)+1, unpin renumbers remaining to 0..n-1; reorder requires the exact current pinned set.
- Verified locally against PGlite behind a tiny Neon-HTTP shim (not committed) with a hand-inserted session; `NEON_FETCH_ENDPOINT` env hook added to `lib/db/index.ts` for this.
- Vercel Web Analytics added (`<Analytics />` in `app/layout.tsx`) at the owner's request, reversing the v1 "no analytics" scope note. Cookieless; enable it in the Vercel dashboard.
