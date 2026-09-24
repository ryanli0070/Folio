import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import type { PublicProfile } from "@/lib/types";
import { resolveAvatarUrl } from "./mappers";

async function load(where: ReturnType<typeof eq>): Promise<PublicProfile | null> {
  const row = await db.query.profiles.findFirst({ where, with: { user: { columns: { image: true } } } });
  if (!row) return null;
  const { user, createdAt: _c, updatedAt: _u, ...rest } = row;
  void _c;
  void _u;
  return { ...rest, avatarUrl: resolveAvatarUrl(row.avatarKey, user?.image) };
}

/** Public lookup by username (case-insensitive input). Cached per request. */
export const getProfileByUsername = cache(async (username: string) =>
  load(eq(profiles.username, username.toLowerCase())),
);

/** Profile for a signed-in user. Cached per request. */
export const getProfileByUserId = cache(async (userId: string) => load(eq(profiles.userId, userId)));
