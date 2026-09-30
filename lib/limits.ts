/** All product limits live here. Raise them in one place. */
const MB = 1024 * 1024;

export const LIMITS = {
  avatarMaxBytes: 2 * MB,
  imageMaxBytes: 8 * MB,
  videoMaxBytes: 100 * MB,
  maxMediaPerProject: 12,
  maxProjectsPerUser: 50,
  maxPinnedProjects: 6,
  maxSkills: 25,
  maxStackTags: 15,
  /** Stack chips shown on a profile card before the "+N" toggle. */
  cardStackPreview: 6,
  maxLinksPerProject: 20,
  maxCollaborators: 20,
  tagMaxLength: 32,
  titleMaxLength: 100,
  taglineMaxLength: 160,
  descriptionMaxLength: 50_000,
  bioMaxLength: 300,
  displayNameMaxLength: 80,
  schoolMaxLength: 100,
  linkLabelMaxLength: 100,
  presignExpiresSeconds: 300,
} as const;

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const VIDEO_TYPES = ["video/mp4", "video/webm"] as const;

export type ImageType = (typeof IMAGE_TYPES)[number];
export type VideoType = (typeof VIDEO_TYPES)[number];
export type AllowedType = ImageType | VideoType;

export const EXTENSION_BY_TYPE: Record<AllowedType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

/** e.g. "JPG, PNG, WEBP, GIF" — for help text. */
export function formatList(types: readonly AllowedType[]): string {
  return types.map((t) => EXTENSION_BY_TYPE[t].toUpperCase()).join(", ");
}

export function toMB(bytes: number): number {
  return Math.round(bytes / MB);
}

export function isImageType(t: string): t is ImageType {
  return (IMAGE_TYPES as readonly string[]).includes(t);
}

export function isVideoType(t: string): t is VideoType {
  return (VIDEO_TYPES as readonly string[]).includes(t);
}

/** Max bytes for a given upload, or null if the type is not allowed for that purpose. */
export function maxBytesFor(purpose: "avatar" | "media", contentType: string): number | null {
  if (purpose === "avatar") return isImageType(contentType) ? LIMITS.avatarMaxBytes : null;
  if (isImageType(contentType)) return LIMITS.imageMaxBytes;
  if (isVideoType(contentType)) return LIMITS.videoMaxBytes;
  return null;
}
