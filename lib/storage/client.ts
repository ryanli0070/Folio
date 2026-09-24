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

type PresignResponse = { key: string; url: string; headers: Record<string, string> };

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function errorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "error" in body && typeof (body as { error: unknown }).error === "string") {
    return (body as { error: string }).error;
  }
  return fallback;
}

async function postJson(url: string, body: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await readJson(res);
  if (!res.ok) {
    throw new Error(errorMessage(data, `Request to ${url} failed (${res.status}).`));
  }
  return data;
}

/** PUTs `file` to `url` with `headers`, reporting upload progress via `onProgress` (0–1). */
function putWithProgress(url: string, file: File, headers: Record<string, string>, onProgress?: (fraction: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    for (const [name, value] of Object.entries(headers)) {
      // Content-Length is a forbidden header for XHR; the browser sets it automatically to the
      // exact byte length of `file`, which is what we signed the URL for.
      if (name.toLowerCase() === "content-length") continue;
      xhr.setRequestHeader(name, value);
    }
    xhr.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve();
      } else {
        reject(new Error(`Upload to storage failed (${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error("Upload to storage failed (network error)."));
    xhr.onabort = () => reject(new Error("Upload aborted."));
    xhr.send(file);
  });
}

export async function uploadFile<T extends UploadTarget>(
  file: File,
  target: T,
  onProgress?: (fraction: number) => void,
): Promise<UploadResult<T>> {
  const presignBody =
    target.purpose === "avatar"
      ? { purpose: "avatar" as const, contentType: file.type, size: file.size }
      : { purpose: "media" as const, projectId: target.projectId, contentType: file.type, size: file.size };

  const { key, url, headers } = (await postJson("/api/uploads/presign", presignBody)) as PresignResponse;

  await putWithProgress(url, file, headers, onProgress);

  const confirmBody =
    target.purpose === "avatar"
      ? { purpose: "avatar" as const, key }
      : { purpose: "media" as const, projectId: target.projectId, key };

  const result = await postJson("/api/uploads/confirm", confirmBody);
  return result as UploadResult<T>;
}
