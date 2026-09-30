"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Star, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MediaDropZone } from "@/components/media/media-drop-zone";
import { LIMITS } from "@/lib/limits";
import { mediaFileError } from "@/lib/media-files";
import { cn } from "@/lib/utils";

/** A file picked on the New project form; uploaded after the project is created. */
export type PendingMedia = { id: string; file: File; previewUrl: string; kind: "image" | "video"; isCover: boolean };

type Props = {
  value: PendingMedia[];
  onChange: (next: PendingMedia[]) => void;
  /** Upload progress (0–1) by item id, while the form is uploading. */
  progress: Record<string, number>;
  disabled: boolean;
};

/** Ensures exactly one item is the thumbnail: keeps the current one, else first image, else first item. */
function withCover(items: PendingMedia[]): PendingMedia[] {
  if (items.length === 0 || items.some((m) => m.isCover)) return items;
  const pick = items.find((m) => m.kind === "image") ?? items[0];
  return items.map((m) => ({ ...m, isCover: m.id === pick.id }));
}

export function PendingMediaPicker({ value, onChange, progress, disabled }: Props) {
  // Revoke preview URLs when the picker goes away (e.g. after redirecting to the edit page).
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);
  useEffect(() => () => latest.current.forEach((m) => URL.revokeObjectURL(m.previewUrl)), []);

  function add(files: File[]) {
    const added: PendingMedia[] = [];
    for (const file of files) {
      const error = mediaFileError(file);
      if (error) {
        toast.error(error);
        continue;
      }
      if (value.length + added.length >= LIMITS.maxMediaPerProject) {
        toast.error(`A project can have at most ${LIMITS.maxMediaPerProject} media items.`);
        break;
      }
      added.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        kind: file.type.startsWith("video/") ? "video" : "image",
        isCover: false,
      });
    }
    if (added.length > 0) onChange(withCover([...value, ...added]));
  }

  function remove(item: PendingMedia) {
    URL.revokeObjectURL(item.previewUrl);
    onChange(withCover(value.filter((m) => m.id !== item.id)));
  }

  function makeCover(item: PendingMedia) {
    onChange(value.map((m) => ({ ...m, isCover: m.id === item.id })));
  }

  return (
    <div className="flex flex-col gap-3">
      {!disabled && value.length < LIMITS.maxMediaPerProject && <MediaDropZone onFiles={add} />}

      {value.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((item) => {
            const pct = progress[item.id];
            return (
              <li key={item.id} className="relative aspect-video overflow-hidden rounded-md border bg-muted">
                {item.kind === "image" ? (
                  <Image src={item.previewUrl} alt={item.file.name} fill unoptimized className="object-cover" />
                ) : (
                  <video
                    src={`${item.previewUrl}#t=0.1`}
                    muted
                    playsInline
                    preload="metadata"
                    className="size-full object-cover"
                  />
                )}
                {item.isCover && <Badge className="absolute top-1.5 left-1.5">Thumbnail</Badge>}
                {!disabled && (
                  <div className="absolute top-1.5 right-1.5 flex gap-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon-xs"
                      aria-pressed={item.isCover}
                      aria-label={item.isCover ? "Profile thumbnail" : "Use as profile thumbnail"}
                      title={item.isCover ? "Profile thumbnail" : "Use as profile thumbnail"}
                      onClick={() => makeCover(item)}
                    >
                      <Star className={cn("size-3.5", item.isCover && "fill-current")} />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon-xs"
                      aria-label={`Remove ${item.file.name}`}
                      onClick={() => remove(item)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                )}
                {pct !== undefined && (
                  <div className="absolute inset-x-0 bottom-0 bg-background/80 p-1.5 backdrop-blur-sm">
                    <Progress value={Math.round(pct * 100)} aria-label={`Uploading ${item.file.name}`} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        {value.length} / {LIMITS.maxMediaPerProject} media items · Files upload when you create the project.
        {value.length > 0 && " Tap the star to choose the thumbnail on your profile."}
      </p>
    </div>
  );
}
