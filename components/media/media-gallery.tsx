"use client";
/**
 * CONTRACT — owned by the Media feature. Public project page gallery:
 * large cover (or first item) plus thumbnails; videos use native controls.
 */
import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import type { MediaItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export type MediaGalleryProps = { media: MediaItem[]; title: string };

/** Cover (or first image, or first item) leads; everything else follows by position. */
function orderMedia(media: MediaItem[]): MediaItem[] {
  const sorted = [...media].sort((a, b) => a.position - b.position);
  const cover = sorted.find((m) => m.isCover) ?? sorted.find((m) => m.kind === "image") ?? sorted[0];
  if (!cover) return sorted;
  return [cover, ...sorted.filter((m) => m.id !== cover.id)];
}

export function MediaGallery({ media, title }: MediaGalleryProps) {
  const ordered = orderMedia(media);
  const [activeId, setActiveId] = useState<string | undefined>(ordered[0]?.id);

  if (ordered.length === 0) return null;

  const active = ordered.find((m) => m.id === activeId) ?? ordered[0];

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-canvas-subtle">
        {active.kind === "image" ? (
          <Image
            key={active.id}
            src={active.url}
            alt={title}
            fill
            sizes="(min-width: 1024px) 768px, 100vw"
            className="object-contain"
            priority
          />
        ) : (
          <video key={active.id} src={active.url} controls playsInline preload="metadata" className="size-full">
            Your browser doesn&apos;t support embedded video.
          </video>
        )}
      </div>

      {ordered.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {ordered.map((item, i) => (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                aria-label={`Show ${item.kind} ${i + 1} of ${ordered.length} for ${title}`}
                aria-current={item.id === active.id}
                onClick={() => setActiveId(item.id)}
                className={cn(
                  "relative block size-16 overflow-hidden rounded-md border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-20",
                  item.id === active.id ? "border-transparent ring-2 ring-ring" : "border-border hover:border-foreground/40",
                )}
              >
                {item.kind === "image" ? (
                  <Image src={item.url} alt="" fill sizes="80px" className="object-cover" />
                ) : (
                  <>
                    <video src={item.url} muted preload="metadata" className="size-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Play className="size-4 fill-white text-white" aria-hidden="true" />
                    </span>
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
