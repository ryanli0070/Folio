import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

const remotePatterns: RemotePattern[] = [{ protocol: "https", hostname: "avatars.githubusercontent.com" }];

if (process.env.R2_PUBLIC_URL) {
  const u = new URL(process.env.R2_PUBLIC_URL);
  remotePatterns.push({
    protocol: u.protocol.replace(":", "") as "http" | "https",
    hostname: u.hostname,
    pathname: `${u.pathname.replace(/\/$/, "")}/**`,
  });
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  images: { remotePatterns },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
