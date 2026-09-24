"use client";
/**
 * Browser upload helper. CONTRACT — owned by the Media feature.
 * Flow: POST /api/uploads/presign → PUT to R2 (with progress) → POST /api/uploads/confirm.
 *
 * API routes (owned by Media):
 *   POST /api/uploads/presign  body { purpose: "avatar" } | { purpose: "media", projectId }
 *                              + { contentType, size } → { key, url, headers }
 *   POST /api/uploads/confirm  body { purpose: "avatar", key } → { avatarUrl }
 *                              body { purpose: "media", projectId, key } → { media: MediaItem }
 *   Errors: non-2xx with { error: string }.
 * Avatar confirm sets profiles.avatarKey and deletes the previous avatar object.
 */
import type { MediaItem } from "@/lib/types";

export type UploadTarget = { purpose: "avatar" } | { purpose: "media"; projectId: string };

export type UploadResult<T extends UploadTarget> = T extends { purpose: "avatar" }
  ? { avatarUrl: string }
  : { media: MediaItem };

export async function uploadFile<T extends UploadTarget>(
  file: File,
  target: T,
  onProgress?: (fraction: number) => void,
): Promise<UploadResult<T>> {
  void file;
  void target;
  void onProgress;
  throw new Error("uploadFile not implemented");
}
