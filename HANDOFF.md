# Handoff

**Status:** Phase 4 done (100% of v1 build). Not deployed; waiting on credentials + Vercel setup by owner.

**Done:**
- All v1 features: profile editor + avatar, public profile, project CRUD with links/markdown/stack/collaborators, R2 media uploader (progress, reorder, cover, delete) + gallery, pin/unpin + drag reorder, 404s, error/loading states, OG metadata, light/dark, mobile layout.
- Verified locally against PGlite (via a throwaway Neon-HTTP shim) with a seeded session: all routes, cross-user edit blocked, markdown sanitized (`<script>`, `javascript:` stripped), create project, invalid URL rejected, profile rename/reserved/taken, pin + keyboard reorder persisted to public page, delete, no horizontal overflow at 375px, dark mode.
- `pnpm db:migrate` verified against a Postgres-wire server (applies, idempotent).
- SETUP.md: Neon, GitHub OAuth (dev + prod apps), R2 bucket/token/public URL/CORS, Vercel env vars, migrations.

**In progress:** —

**Next steps:**
1. Owner: create `.env.local` (see `.env.example`), `pnpm db:migrate`, `pnpm dev`, sign in with GitHub.
2. Owner: real upload test (image + video + avatar) once R2 + CORS are set — the only flow not exercised locally.
3. Deploy per SETUP.md §5.

**Known issues:**
- Not exercised: real GitHub OAuth round-trip, real R2 upload/HEAD/delete (no creds).
- Presigned-but-never-confirmed uploads leave orphan R2 objects (suggest an R2 lifecycle rule).
- No transactions (neon-http): pin/media ordering uses `db.batch`; concurrent edits from two tabs could interleave (fine at ~10 users).

**Env/credentials still needed:** DATABASE_URL, AUTH_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL (+ optional NEXT_PUBLIC_SITE_URL).

**Decisions this session:** docs/PLAN.md › Decisions.
