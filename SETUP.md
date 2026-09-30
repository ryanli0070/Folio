# Folio setup

## 1. Local development
1. `pnpm install`
2. Copy `.env.example` → `.env.local` and fill in every value (sections below).
3. `pnpm db:migrate` — applies `drizzle/*.sql` to `DATABASE_URL`.
4. `pnpm dev` → http://localhost:3000

### Optional: local database without Neon
`lib/db/index.ts` honors `NEON_FETCH_ENDPOINT`, so you can run Postgres locally behind a Neon-compatible
SQL-over-HTTP proxy (Neon publishes one for local development; see their docs) and set e.g.
`NEON_FETCH_ENDPOINT=http://localhost:4444/sql`. Leave it unset in production.

## 2. Neon Postgres
Create a Neon project and copy the **direct** (connection pooling off) connection string into `DATABASE_URL` (include `?sslmode=require`). The app uses Neon's HTTP driver, so pooling doesn't matter at runtime, and migrations are safest over a direct connection.
Use a separate Neon branch for local dev if you want to keep prod data clean.

## 3. GitHub OAuth app
GitHub → Settings → Developer settings → OAuth Apps → New. Create **two** apps (OAuth apps allow one callback URL each):
| | Homepage URL | Authorization callback URL |
|---|---|---|
| dev | `http://localhost:3000` | `http://localhost:3000/api/auth/callback/github` |
| prod | `https://<your-domain>` | `https://<your-domain>/api/auth/callback/github` |
Put the client ID/secret in `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`. Generate `AUTH_SECRET` with `npx auth secret` (different value per environment).

## 4. Cloudflare R2
1. Create a bucket → `R2_BUCKET`. Your account ID → `R2_ACCOUNT_ID`.
2. R2 → Manage API tokens → create a token with **Object Read & Write** scoped to the bucket → `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`.
3. Enable public access (r2.dev subdomain, or better a custom domain) → `R2_PUBLIC_URL` (no trailing slash).
4. CORS: see [R2 CORS](#r2-cors).
5. Optional: add an object lifecycle rule to clean abandoned uploads (presigned but never confirmed).

## R2 CORS
Uploads go straight from the browser to R2 with presigned PUTs, so the bucket must allow cross-origin PUT from each app origin.
R2 → bucket → Settings → CORS Policy:
```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://<your-domain>"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["content-type", "content-length"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```
Add every origin you upload from (e.g. a Vercel preview URL); wildcard subdomains aren't supported.

## 5. Deploy to Vercel
1. Import the repo in Vercel (framework: Next.js; install command auto-detects pnpm).
2. Project → Settings → Environment Variables: add every variable from `.env.example` for **Production** (and Preview if used). Use the prod GitHub OAuth app and set `NEXT_PUBLIC_SITE_URL=https://<your-domain>`.
3. Run migrations against the prod database before (or right after) the first deploy:
   `DATABASE_URL=<prod url> pnpm db:migrate` (drizzle.config.ts reads `.env.local`, but an exported env var wins). Migrations use the `pg` driver over the direct connection string.
4. Deploy, then sign in once to confirm the OAuth callback works.
5. After a schema change: `pnpm db:generate`, commit the new `drizzle/` file, run `pnpm db:migrate` against prod, deploy.

## 6. Abuse protection (already built in)
- **Uploads**: max `LIMITS.uploadsPerHour` upload URLs per user per hour and `LIMITS.storageQuotaBytes` stored per user
  (unconfirmed uploads count for 24h). Tune in `lib/limits.ts`.
- **Cleanup cron**: `vercel.json` runs `/api/cron/cleanup-uploads` daily to delete uploads that were never confirmed.
  Set `CRON_SECRET` in Vercel (Production) or the job returns 401 and does nothing. Check runs under Settings → Cron Jobs.
- **Security headers**: set in `next.config.ts`.
- **If you ever get flooded**: Vercel → Firewall → turn on *Attack Challenge Mode*, or block an IP there. Nothing in the app needs to change.
- **Schema changes ship before code**: run `pnpm db:migrate` against production *before* pushing code that needs the new table.
