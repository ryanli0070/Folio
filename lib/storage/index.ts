import "server-only";
/**
 * Storage module (Cloudflare R2 via the S3 API). CONTRACT — owned by the Media feature.
 * Keys are always `users/{userId}/{uuid}.{ext}`.
 */
import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { type AllowedType, EXTENSION_BY_TYPE, LIMITS, maxBytesFor } from "@/lib/limits";

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

export class StorageError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) return client;
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new StorageError(
      "R2 storage is not configured (missing R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, or R2_SECRET_ACCESS_KEY).",
      500,
    );
  }
  client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
    // Newer SDK versions attach checksum headers/params by default, which R2 doesn't expect on
    // a browser-issued presigned PUT and will reject. Only compute checksums when asked for one.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return client;
}

function getBucket(): string {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new StorageError("R2 storage is not configured (missing R2_BUCKET).", 500);
  return bucket;
}

/**
 * Validates type/size against lib/limits (throws StorageError on violation) and returns a presigned PUT.
 * Callers are responsible for auth and quota checks before calling.
 */
export async function createUploadUrl(input: CreateUploadUrlInput): Promise<CreateUploadUrlResult> {
  const { userId, purpose, contentType, size } = input;
  const max = maxBytesFor(purpose, contentType);
  if (max == null) {
    throw new StorageError(`${contentType || "This file type"} is not allowed for ${purpose} uploads.`, 400);
  }
  if (!Number.isFinite(size) || size <= 0) {
    throw new StorageError("Invalid file size.", 400);
  }
  if (size > max) {
    throw new StorageError(`File exceeds the ${Math.floor(max / (1024 * 1024))}MB limit.`, 413);
  }

  const ext = EXTENSION_BY_TYPE[contentType as AllowedType];
  const key = `users/${userId}/${crypto.randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: contentType,
    ContentLength: size,
  });
  const url = await getSignedUrl(getClient(), command, {
    expiresIn: LIMITS.presignExpiresSeconds,
    // Sign Content-Type too so R2 rejects a PUT whose type differs from what we approved.
    signableHeaders: new Set(["content-type", "content-length"]),
  });

  return { key, url, headers: { "Content-Type": contentType, "Content-Length": String(size) } };
}

/**
 * HEADs the object and verifies it exists, is owned by `userId` (key prefix), and matches
 * allowed type + size for `purpose`. On mismatch deletes the object and throws StorageError.
 */
export async function confirmUpload(key: string, opts: { userId: string; purpose: UploadPurpose }): Promise<ConfirmedObject> {
  const { userId, purpose } = opts;
  if (!key.startsWith(`users/${userId}/`)) {
    throw new StorageError("This upload does not belong to you.", 403);
  }

  let contentType: string;
  let size: number;
  try {
    const head = await getClient().send(new HeadObjectCommand({ Bucket: getBucket(), Key: key }));
    contentType = head.ContentType ?? "";
    size = head.ContentLength ?? 0;
  } catch {
    throw new StorageError("Uploaded file was not found.", 400);
  }

  const max = maxBytesFor(purpose, contentType);
  if (max == null) {
    await deleteObject(key);
    throw new StorageError(`${contentType || "This file type"} is not allowed for ${purpose} uploads.`, 400);
  }
  if (size <= 0 || size > max) {
    await deleteObject(key);
    throw new StorageError(`Uploaded file exceeds the ${Math.floor(max / (1024 * 1024))}MB limit.`, 413);
  }

  return { key, size, contentType };
}

/** Deletes an object. Never throws for a missing object. */
export async function deleteObject(key: string): Promise<void> {
  try {
    await getClient().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
  } catch (err) {
    console.error(`storage.deleteObject failed for key "${key}"`, err);
  }
}

/** Public URL for a key, based on R2_PUBLIC_URL. Pure; safe to call anywhere on the server. */
export function publicUrl(key: string): string {
  const base = (process.env.R2_PUBLIC_URL ?? "").replace(/\/+$/, "");
  return `${base}/${key}`;
}
