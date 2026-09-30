"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { formatList, IMAGE_TYPES, LIMITS, toMB, VIDEO_TYPES } from "@/lib/limits";
import { MEDIA_ACCEPT } from "@/lib/media-files";
import { cn } from "@/lib/utils";

/** Click-or-drop target for project media, with the supported-format hint. Validation is the caller's job. */
export function MediaDropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        onFiles(Array.from(e.dataTransfer.files));
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-1.5 rounded-md border border-dashed p-6 text-center transition-colors hover:bg-muted/40",
        isDragOver && "border-ring bg-muted/60",
      )}
    >
      <ImagePlus className="size-5 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm">
        Drag and drop, or <span className="text-link underline underline-offset-4">browse files</span>
      </p>
      <p className="text-xs text-muted-foreground">
        Images: {formatList(IMAGE_TYPES)} (max {toMB(LIMITS.imageMaxBytes)} MB) · Videos: {formatList(VIDEO_TYPES)} (max{" "}
        {toMB(LIMITS.videoMaxBytes)} MB)
      </p>
      <p className="text-xs text-muted-foreground">MOV and other formats aren&apos;t supported. Export videos as MP4 first.</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={MEDIA_ACCEPT}
        className="sr-only"
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
    </div>
  );
}
