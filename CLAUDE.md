@AGENTS.md

# Folio

Portfolio webapp: one public page per user listing all their projects (links, media, markdown, stack, collaborators).

## Stack
Next.js 16 (App Router, TS strict) · pnpm · Tailwind v4 + shadcn/ui (restyled Primer-like) · Neon Postgres + Drizzle ORM/drizzle-kit · Auth.js v5 (GitHub only, Drizzle adapter, DB sessions) · Cloudflare R2 via S3 SDK presigned PUTs · zod · react-markdown + remark-gfm + rehype-sanitize · dnd-kit · next-themes.

## Commands
- `pnpm dev` / `pnpm build` / `pnpm typecheck` / `pnpm lint`
- `pnpm db:generate` (drizzle-kit generate) · `pnpm db:migrate` (apply migrations) · `pnpm db:studio`

## Folders
- `app/` routes. `app/(dashboard)/dashboard/...` authed pages; `app/[username]/...` public pages.
- `components/ui/` shadcn primitives · `components/<feature>/` feature components.
- `lib/db/schema.ts` Drizzle schema (only place tables are defined) · `lib/db/index.ts` client · `lib/queries/` read helpers.
- `lib/actions/` server actions (mutations) · `lib/validation/` zod schemas.
- `lib/storage/` R2 module · `lib/limits.ts` all limits · `lib/types.ts` shared types.
- `drizzle/` generated migrations (never hand-edit).

## Rules
- Every server action / route handler that mutates: `const user = await requireUser()` then verify ownership of the resource in the query (`where userId = user.id`). Never accept userId from the client.
- Validate every input with zod. URLs must be http(s) (`httpUrl` in `lib/validation`).
- All limits (sizes, types, counts) come from `lib/limits.ts`. No magic numbers elsewhere.
- Markdown: react-markdown + remark-gfm + rehype-sanitize only. Never `dangerouslySetInnerHTML`, never rehype-raw.
- Deleting/replacing media, projects, or avatars must also delete the R2 object (`deleteObject`).
- No GitHub logos/name as branding.
- Before committing: `pnpm typecheck && pnpm lint && pnpm build`. One concern per commit.
