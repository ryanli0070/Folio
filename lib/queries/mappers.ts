import "server-only";
import { publicUrl } from "@/lib/storage";
import type { LinkItem, MediaItem, ProjectLinkRow, ProjectMediaRow } from "@/lib/types";

export function toMediaItem(m: ProjectMediaRow): MediaItem {
  return {
    id: m.id,
    key: m.key,
    url: publicUrl(m.key),
    kind: m.kind,
    contentType: m.contentType,
    size: m.size,
    position: m.position,
    isCover: m.isCover,
  };
}

export function toLinkItem(l: ProjectLinkRow): LinkItem {
  return { id: l.id, label: l.label, url: l.url, position: l.position };
}

/** Uploaded avatar → GitHub image → null. */
export function resolveAvatarUrl(avatarKey: string | null, githubImage: string | null | undefined): string | null {
  if (avatarKey) return publicUrl(avatarKey);
  return githubImage ?? null;
}

/** Profile thumbnail = media flagged isCover (image or video), else first image, else first item. */
export function pickCover(media: MediaItem[]): MediaItem | null {
  return media.find((m) => m.isCover) ?? media.find((m) => m.kind === "image") ?? media[0] ?? null;
}

/** Link-preview image: the cover if it is an image, else the first image. Videos can't be OG images. */
export function pickOgImage(media: MediaItem[]): MediaItem | null {
  const cover = media.find((m) => m.isCover);
  if (cover?.kind === "image") return cover;
  return media.find((m) => m.kind === "image") ?? null;
}
