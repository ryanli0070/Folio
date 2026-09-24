import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { RESERVED_USERNAMES, sanitizeUsername } from "@/lib/validation/common";

/** Creates the user's profile on first sign-in. Idempotent. */
export async function ensureProfile(userId: string, login: string | undefined, name: string | null | undefined) {
  const existing = await db.query.profiles.findFirst({ where: eq(profiles.userId, userId), columns: { userId: true } });
  if (existing) return;

  const base = sanitizeUsername(login ?? name ?? "user");
  for (let i = 0; i < 50; i++) {
    const suffix = i === 0 ? "" : `-${i + 1}`;
    const candidate = `${base.slice(0, 39 - suffix.length).replace(/-$/, "")}${suffix}`;
    if (RESERVED_USERNAMES.has(candidate)) continue;
    const inserted = await db
      .insert(profiles)
      .values({ userId, username: candidate, displayName: name ?? "", githubUrl: login ? `https://github.com/${login}` : null })
      .onConflictDoNothing()
      .returning({ userId: profiles.userId });
    if (inserted.length > 0) return;
    const raced = await db.query.profiles.findFirst({ where: eq(profiles.userId, userId), columns: { userId: true } });
    if (raced) return;
  }
  throw new Error("Could not allocate a username");
}
