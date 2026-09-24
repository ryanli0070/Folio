/**
 * CONTRACT — owned by the Media feature. Public project page gallery:
 * large cover (or first item) plus thumbnails; videos use native controls.
 */
import type { MediaItem } from "@/lib/types";

export type MediaGalleryProps = { media: MediaItem[]; title: string };

export function MediaGallery({ media }: MediaGalleryProps) {
  if (media.length === 0) return null;
  return null;
}
