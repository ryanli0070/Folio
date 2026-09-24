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

const nextConfig: NextConfig = {
  images: { remotePatterns },
};

export default nextConfig;
