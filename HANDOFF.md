# Handoff

**Status:** Phase 1 done (≈30%). Next: Phase 2 (3 feature subagents).

**Done:**
- Phase 0 docs; Next.js 16 + Tailwind v4 + shadcn (radix-nova) scaffold; Primer tokens (`app/globals.css`); header, theme toggle, user menu, landing.
- Drizzle schema + migration `drizzle/0000_*.sql` (not yet applied — no DATABASE_URL).
- Auth.js v5 GitHub + DB sessions (`lib/auth.ts`), profile auto-created on sign-in (`lib/profile-bootstrap.ts`).
- Contracts: `lib/limits.ts`, `lib/types.ts`, `lib/queries/*`, `lib/validation/common.ts`, `lib/session.ts`, `lib/storage/{index,client}.ts` (stubs), `components/media/{media-uploader,media-gallery}.tsx` (stubs).

**In progress:** —

**Next steps:** Phase 2 A/B/C → integrate → Phase 3 → Phase 4.

**Known issues:** Sign-in not verified end to end (no credentials). `/` and `/dashboard` redirect verified on dev server.

**Env/credentials still needed:** `.env.local` absent — all of DATABASE_URL, AUTH_SECRET, AUTH_GITHUB_ID/SECRET, R2_* . Then run `pnpm db:migrate`.

**Decisions this session:** docs/PLAN.md › Decisions.
