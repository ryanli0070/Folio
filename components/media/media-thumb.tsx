import Image from "next/image";
import type { MediaItem } from "@/lib/types";
import { videoSrcWithPoster } from "@/lib/video";

/** Fills its (relative, sized) parent with an image or a video's first frame. */
export function MediaThumb({ item, sizes, unoptimized }: { item: MediaItem; sizes: string; unoptimized?: boolean }) {
  if (item.kind === "video") {
    return (
      <video
        src={videoSrcWithPoster(item.url)}
        muted
        playsInline
        preload="metadata"
        aria-hidden
        className="absolute inset-0 size-full object-cover"
      />
    );
  }
  return <Image src={item.url} alt="" fill sizes={sizes} unoptimized={unoptimized} className="object-cover" />;
}
