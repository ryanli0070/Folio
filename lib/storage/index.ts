import "server-only";
/**
 * Storage module (Cloudflare R2 via the S3 API). CONTRACT — owned by the Media feature.
 * Keys are always `users/{userId}/{uuid}.{ext}`.
 */

export type UploadPurpose = "avatar" | "media";

export type CreateUploadUrlInput = {
  userId: string;
  purpose: UploadPurpose;
  contentType: string;
  size: number;
};

export type CreateUploadUrlResult = {
  key: string;
  /** Presigned PUT URL; browser must send exactly `headers`. */
  url: string;
  headers: Record<string, string>;
};

export type ConfirmedObject = { key: string; size: number; contentType: string };

/**
 * Validates type/size against lib/limits (throws StorageError on violation) and returns a presigned PUT.
 * Callers are responsible for auth and quota checks before calling.
 */
export async function createUploadUrl(input: CreateUploadUrlInput): Promise<CreateUploadUrlResult> {
  void input;
  throw new Error("storage.createUploadUrl not implemented");
}

/**
 * HEADs the object and verifies it exists, is owned by `userId` (key prefix), and matches
 * allowed type + size for `purpose`. On mismatch deletes the object and throws StorageError.
 */
export async function confirmUpload(key: string, opts: { userId: string; purpose: UploadPurpose }): Promise<ConfirmedObject> {
  void key;
  void opts;
  throw new Error("storage.confirmUpload not implemented");
}

/** Deletes an object. Never throws for a missing object. */
export async function deleteObject(key: string): Promise<void> {
  void key;
  throw new Error("storage.deleteObject not implemented");
}

/** Public URL for a key, based on R2_PUBLIC_URL. Pure; safe to call anywhere on the server. */
export function publicUrl(key: string): string {
  const base = (process.env.R2_PUBLIC_URL ?? "").replace(/\/+$/, "");
  return `${base}/${key}`;
}

export class StorageError extends Error {}
