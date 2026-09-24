# Folio v1 plan

## Phases
- [ ] 0 Plan: CLAUDE.md, PLAN.md, HANDOFF.md
- [ ] 1 Foundation: scaffold, Tailwind/shadcn, Primer tokens, app shell, schema + migrations, Auth.js, profile-on-signup, contracts (queries, types, limits, storage interface, MediaUploader props)
- [ ] 2 Features (3 subagents): A Profile · B Projects · C Media
- [ ] 3 Integration: pin + dnd reorder, empty/loading/error states, 404s, OG metadata, mobile pass, manual walkthrough
- [ ] 4 Deploy readiness: SETUP.md (Vercel, OAuth callback, R2 CORS, migrations), final build

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
