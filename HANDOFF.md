# Handoff

**Status:** Phase 2 done (≈65%). Next: Phase 3 integration/polish.

**Done:**
- Phases 0–1 (scaffold, schema, auth, contracts).
- A Profile: `app/dashboard/profile/*`, `lib/actions/profile.ts`, `components/profile/*`, public `app/[username]/*`.
- B Projects: `lib/actions/projects.ts`, `components/projects/*` (form, link editor, markdown), dashboard list, new/edit pages, public `app/[username]/[slug]/*`.
- C Media: `lib/storage/*` (R2), `app/api/uploads/{presign,confirm}`, `lib/actions/media.ts`, `components/media/*`.
- Integration fixes: signed Content-Type, key-format + key-reuse guards, image-only covers, touch-visible media controls, name/school/link-label limits.

**In progress:** —

**Next steps:** 1) pin/unpin + dnd-kit reorder in `app/dashboard/page.tsx` (placeholder marked). 2) loading.tsx/error.tsx, empty states. 3) OG check, mobile pass. 4) Dedupe TagInput (`components/profile/tag-input.tsx` vs `components/projects/tag-input.tsx`). 5) Phase 4 final SETUP review.

**Known issues:** No end-to-end run yet (no DB/OAuth/R2 creds): public pages 500 locally only because DATABASE_URL is missing. Orphaned R2 objects possible if an upload is never confirmed.

**Env/credentials still needed:** `.env.local` with all vars in `.env.example`; then `pnpm db:migrate`.

**Decisions this session:** docs/PLAN.md › Decisions.
