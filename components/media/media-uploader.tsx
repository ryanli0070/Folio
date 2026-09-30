"use client";
/**
 * CONTRACT — owned by the Media feature. Used on /dashboard/projects/[id]/edit.
 * Manages uploads (with progress), drag reorder, choose cover, and delete for one project.
 * All changes persist immediately via server actions; `onChange` reports the new list.
 */
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImagePlus, Star, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteMedia, reorderMedia, setCover } from "@/lib/actions/media";
import { formatList, IMAGE_TYPES, LIMITS, maxBytesFor, toMB, VIDEO_TYPES } from "@/lib/limits";
import { uploadFile } from "@/lib/storage/client";
import type { MediaItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { videoSrcWithPoster } from "@/lib/video";

export type MediaUploaderProps = {
  projectId: string;
  initialMedia: MediaItem[];
  onChange?: (media: MediaItem[]) => void;
};

type QueueItem = { id: string; file: File; progress: number; error?: string };

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm";

export function MediaUploader({ projectId, initialMedia, onChange }: MediaUploaderProps) {
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MediaItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [renderedProjectId, setRenderedProjectId] = useState(projectId);

  const inputRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef<QueueItem[]>([]);
  const processingRef = useRef(false);

  // A different project (navigated edit page) resets local state to the server's list.
  // Adjusted during render rather than an effect, per React's guidance for resetting state
  // when a prop changes: https://react.dev/learn/you-might-not-need-an-effect
  if (projectId !== renderedProjectId) {
    setRenderedProjectId(projectId);
    setMedia(initialMedia);
    setQueue([]);
  }

  // Refs aren't part of render output, so the pending-upload queue is cleared in an effect.
  useEffect(() => {
    pendingRef.current = [];
  }, [projectId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sorted = [...media].sort((a, b) => a.position - b.position);

  function updateMedia(next: MediaItem[]) {
    setMedia(next);
    onChange?.(next);
  }

  async function uploadOne(item: QueueItem) {
    try {
      const result = await uploadFile(item.file, { purpose: "media", projectId }, (fraction) => {
        setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, progress: fraction } : q)));
      });
      updateMedia([...media, result.media]);
      setQueue((prev) => prev.filter((q) => q.id !== item.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      toast.error(`${item.file.name}: ${message}`);
      setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, error: message } : q)));
    }
  }

  async function processQueue() {
    if (processingRef.current) return;
    processingRef.current = true;
    while (pendingRef.current.length > 0) {
      const item = pendingRef.current[0];
      await uploadOne(item);
      pendingRef.current = pendingRef.current.slice(1);
    }
    processingRef.current = false;
  }

  function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const accepted: File[] = [];
    let projected = media.length + pendingRef.current.length;

    for (const file of files) {
      const max = maxBytesFor("media", file.type);
      if (max == null) {
        toast.error(unsupportedMessage(file));
        continue;
      }
      if (file.size > max) {
        toast.error(`${file.name}: is over the ${toMB(max)} MB limit.`);
        continue;
      }
      if (projected >= LIMITS.maxMediaPerProject) {
        toast.error(`This project can have at most ${LIMITS.maxMediaPerProject} media items.`);
        break;
      }
      projected += 1;
      accepted.push(file);
    }

    if (accepted.length === 0) return;

    const items: QueueItem[] = accepted.map((file) => ({ id: crypto.randomUUID(), file, progress: 0 }));
    pendingRef.current = [...pendingRef.current, ...items];
    setQueue((prev) => [...prev, ...items]);
    void processQueue();
  }

  function dismissQueueItem(id: string) {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sorted.findIndex((m) => m.id === active.id);
    const newIndex = sorted.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previous = media;
    const reordered = arrayMove(sorted, oldIndex, newIndex).map((m, i) => ({ ...m, position: i }));
    updateMedia(reordered);

    const result = await reorderMedia(
      projectId,
      reordered.map((m) => m.id),
    );
    if (!result.ok) {
      updateMedia(previous);
      toast.error(result.error);
    }
  }

  async function handleSetCover(item: MediaItem) {
    if (item.isCover || busyId) return;
    const previous = media;
    updateMedia(media.map((m) => ({ ...m, isCover: m.id === item.id })));
    setBusyId(item.id);
    const result = await setCover(projectId, item.id);
    setBusyId(null);
    if (!result.ok) {
      updateMedia(previous);
      toast.error(result.error);
    }
  }

  async function confirmDelete() {
    const item = pendingDelete;
    if (!item) return;
    setPendingDelete(null);
    const previous = media;
    updateMedia(media.filter((m) => m.id !== item.id));
    setBusyId(item.id);
    const result = await deleteMedia(projectId, item.id);
    setBusyId(null);
    if (!result.ok) {
      updateMedia(previous);
      toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-4">
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
          handleFiles(e.dataTransfer.files);
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
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files ?? []);
            e.target.value = "";
          }}
        />
      </div>

      {queue.length > 0 && (
        <ul className="flex flex-col gap-2">
          {queue.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
              <span className="flex-1 truncate">{item.file.name}</span>
              {item.error ? (
                <>
                  <span className="text-xs text-destructive">{item.error}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Dismiss ${item.file.name}`}
                    onClick={() => dismissQueueItem(item.id)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <Progress value={Math.round(item.progress * 100)} className="w-24" />
                  <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
                    {Math.round(item.progress * 100)}%
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {sorted.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void handleDragEnd(e)}>
          <SortableContext items={sorted.map((m) => m.id)} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {sorted.map((item) => (
                <SortableMediaItem
                  key={item.id}
                  item={item}
                  disabled={busyId === item.id}
                  onSetCover={() => void handleSetCover(item)}
                  onRequestDelete={() => setPendingDelete(item)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <p className="text-xs text-muted-foreground">
        {media.length} / {LIMITS.maxMediaPerProject} media items
        {media.length > 0 && " · Tap the star on an image or video to use it as the thumbnail on your profile."}
      </p>

      <AlertDialog open={pendingDelete != null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this media?</AlertDialogTitle>
            <AlertDialogDescription>This removes the file permanently. This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void confirmDelete()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SortableMediaItem({
  item,
  disabled,
  onSetCover,
  onRequestDelete,
}: {
  item: MediaItem;
  disabled: boolean;
  onSetCover: () => void;
  onRequestDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative aspect-square overflow-hidden rounded-md border bg-canvas-subtle",
        isDragging && "opacity-50",
      )}
    >
      {item.kind === "image" ? (
        <Image src={item.url} alt="" fill sizes="(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw" className="object-cover" />
      ) : (
        <video src={videoSrcWithPoster(item.url)} muted playsInline preload="metadata" className="size-full object-cover" />
      )}

      {item.isCover && <Badge className="absolute top-1.5 left-1.5">Thumbnail</Badge>}

      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="absolute bottom-1.5 left-1.5 flex size-6 touch-none cursor-grab items-center justify-center rounded-md bg-background/80 text-foreground backdrop-blur-sm transition-opacity md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="size-3.5" />
      </button>

      <div className="absolute top-1.5 right-1.5 flex gap-1 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
        <Button
          type="button"
          variant="secondary"
          size="icon-xs"
          disabled={disabled}
          aria-pressed={item.isCover}
          aria-label={item.isCover ? "Profile thumbnail" : "Use as profile thumbnail"}
          title={item.isCover ? "Profile thumbnail" : "Use as profile thumbnail"}
          onClick={onSetCover}
        >
          <Star className={cn("size-3.5", item.isCover && "fill-current")} />
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="icon-xs"
          disabled={disabled}
          aria-label="Delete media"
          onClick={onRequestDelete}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </li>
  );
}

function unsupportedMessage(file: File): string {
  const isMov = file.type === "video/quicktime" || /\.mov$/i.test(file.name);
  if (isMov) return `${file.name}: MOV isn't supported. Export it as MP4 (QuickTime: File → Export As) and upload again.`;
  return `${file.name}: unsupported format. Use ${formatList(IMAGE_TYPES)} for images or ${formatList(VIDEO_TYPES)} for videos.`;
}
