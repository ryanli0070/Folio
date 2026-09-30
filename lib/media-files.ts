import { formatList, IMAGE_TYPES, maxBytesFor, toMB, VIDEO_TYPES } from "@/lib/limits";

/** `accept` attribute for project media file inputs. */
export const MEDIA_ACCEPT = [...IMAGE_TYPES, ...VIDEO_TYPES].join(",");

/** Client-side pre-check for a project media file. Returns a user-facing error, or null if OK. The server re-checks. */
export function mediaFileError(file: File): string | null {
  const max = maxBytesFor("media", file.type);
  if (max == null) {
    const isMov = file.type === "video/quicktime" || /\.mov$/i.test(file.name);
    if (isMov) return `${file.name}: MOV isn't supported. Export it as MP4 (QuickTime: File → Export As) and upload again.`;
    return `${file.name}: unsupported format. Use ${formatList(IMAGE_TYPES)} for images or ${formatList(VIDEO_TYPES)} for videos.`;
  }
  if (file.size > max) return `${file.name}: is over the ${toMB(max)} MB limit.`;
  return null;
}
