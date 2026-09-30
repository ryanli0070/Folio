import "server-only";
import { and, count, eq, gt, inArray, isNotNull, isNull, lt, sum } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles, projectMedia, uploadIntents } from "@/lib/db/schema";
import { LIMITS, toMB } from "@/lib/limits";
import { deleteObject, type UploadPurpose } from "@/lib/storage";

const HOUR_MS = 60 * 60 * 1000;

/** Returns [status, message] if this user may not start another upload of `size` bytes, else null. */
export async function uploadBlockedReason(userId: string, size: number): Promise<[number, string] | null> {
  const hourAgo = new Date(Date.now() - HOUR_MS);
  const pendingSince = new Date(Date.now() - LIMITS.pendingUploadTtlHours * HOUR_MS);

  const [[recent], [stored], [pending]] = await Promise.all([
    db
      .select({ n: count() })
      .from(uploadIntents)
      .where(and(eq(uploadIntents.userId, userId), gt(uploadIntents.createdAt, hourAgo))),
    db.select({ bytes: sum(projectMedia.size) }).from(projectMedia).where(eq(projectMedia.userId, userId)),
    db
      .select({ bytes: sum(uploadIntents.size) })
      .from(uploadIntents)
      .where(
        and(eq(uploadIntents.userId, userId), isNull(uploadIntents.confirmedAt), gt(uploadIntents.createdAt, pendingSince)),
      ),
  ]);

  if ((recent?.n ?? 0) >= LIMITS.uploadsPerHour) {
    return [429, `You've started ${LIMITS.uploadsPerHour} uploads in the last hour. Try again later.`];
  }
  const used = Number(stored?.bytes ?? 0) + Number(pending?.bytes ?? 0);
  if (used + size > LIMITS.storageQuotaBytes) {
    return [413, `This would exceed your ${toMB(LIMITS.storageQuotaBytes)} MB storage limit. Delete some media first.`];
  }
  return null;
}

export async function recordUploadIntent(userId: string, key: string, purpose: UploadPurpose, size: number) {
  await db.insert(uploadIntents).values({ userId, key, purpose, size });
}

/** True if `key` was issued to `userId` and hasn't been confirmed yet. */
export async function hasPendingIntent(userId: string, key: string): Promise<boolean> {
  const row = await db.query.uploadIntents.findFirst({
    where: and(eq(uploadIntents.key, key), eq(uploadIntents.userId, userId), isNull(uploadIntents.confirmedAt)),
    columns: { id: true },
  });
  return !!row;
}

export async function markIntentConfirmed(key: string) {
  await db.update(uploadIntents).set({ confirmedAt: new Date() }).where(eq(uploadIntents.key, key));
}

export async function discardIntent(key: string) {
  await db.delete(uploadIntents).where(eq(uploadIntents.key, key));
}

/**
 * Deletes R2 objects for uploads never confirmed within the TTL, and prunes old confirmed rows
 * (only the last hour matters for rate limiting). Idempotent; safe to run repeatedly.
 * Never deletes an object that a media row or avatar still references.
 */
export async function cleanupStaleUploads(): Promise<{ deletedObjects: number; prunedRows: number }> {
  const staleBefore = new Date(Date.now() - LIMITS.pendingUploadTtlHours * HOUR_MS);
  const stale = await db
    .select({ key: uploadIntents.key })
    .from(uploadIntents)
    .where(and(isNull(uploadIntents.confirmedAt), lt(uploadIntents.createdAt, staleBefore)))
    .limit(500);
  const keys = stale.map((r) => r.key);

  let deletedObjects = 0;
  if (keys.length > 0) {
    const [media, avatars] = await Promise.all([
      db.select({ key: projectMedia.key }).from(projectMedia).where(inArray(projectMedia.key, keys)),
      db.select({ key: profiles.avatarKey }).from(profiles).where(inArray(profiles.avatarKey, keys)),
    ]);
    const inUse = new Set([...media, ...avatars].map((r) => r.key));
    for (const key of keys) {
      if (inUse.has(key)) continue;
      await deleteObject(key);
      deletedObjects += 1;
    }
    await db.delete(uploadIntents).where(inArray(uploadIntents.key, keys));
  }

  const pruned = await db
    .delete(uploadIntents)
    .where(and(isNotNull(uploadIntents.confirmedAt), lt(uploadIntents.createdAt, staleBefore)))
    .returning({ id: uploadIntents.id });

  return { deletedObjects, prunedRows: keys.length + pruned.length };
}
