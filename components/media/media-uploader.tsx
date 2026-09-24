"use client";
/**
 * CONTRACT — owned by the Media feature. Used on /dashboard/projects/[id]/edit.
 * Manages uploads (with progress), drag reorder, choose cover, and delete for one project.
 * All changes persist immediately via server actions; `onChange` reports the new list.
 */
import type { MediaItem } from "@/lib/types";

export type MediaUploaderProps = {
  projectId: string;
  initialMedia: MediaItem[];
  onChange?: (media: MediaItem[]) => void;
};

export function MediaUploader({ initialMedia }: MediaUploaderProps) {
  return <p className="text-sm text-muted-foreground">{initialMedia.length} media (uploader coming soon)</p>;
}
