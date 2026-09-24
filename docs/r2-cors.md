# R2 bucket CORS

Uploads go browser → R2 directly with presigned PUT URLs (see `lib/storage/`), so the R2 bucket
must allow cross-origin `PUT` (the upload itself) plus `GET`/`HEAD` (serving/inspecting objects)
from the app's origins.

In the Cloudflare dashboard: **R2 → (bucket) → Settings → CORS Policy**, or via `wrangler`/the API,
set the bucket's CORS rules to:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://<production-domain>"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["content-type", "content-length"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Replace `https://<production-domain>` with the deployed site's origin (e.g. the Vercel production
URL or custom domain). Add any preview domains you upload from too — Cloudflare does not support
wildcard subdomains in `AllowedOrigins`, so each origin that performs uploads needs its own entry.

## Public access for `R2_PUBLIC_URL`

Presigned PUTs only grant temporary write access to a single object; they don't make the bucket
readable. For uploaded media/avatars to actually render on the site, the bucket also needs a
public read path, either:

- **R2.dev subdomain**: enable "Public Access" on the bucket in the dashboard, which gives you a
  `https://pub-<hash>.r2.dev` URL, or
- **Custom domain**: attach a domain you control to the bucket (R2 → bucket → Settings → Custom
  Domains), which serves objects over `https://<your-domain>`.

Either way, set `R2_PUBLIC_URL` to that base URL (no trailing slash) — `lib/storage/publicUrl()`
appends the object key directly to it, and `next.config.ts` reads it to allow the host in
`next/image`.
