"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pin, PinOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { reorderPinned, setPinned } from "@/lib/actions/pins";
import { LIMITS } from "@/lib/limits";
import type { ProjectCard } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = { cards: ProjectCard[]; username: string | null };

export function ProjectList({ cards, username }: Props) {
  const pinned = cards.filter((c) => c.pinned);
  const others = cards.filter((c) => !c.pinned);
  const canPinMore = pinned.length < LIMITS.maxPinnedProjects;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">Pinned</h2>
          <span className="text-xs text-muted-foreground">
            {pinned.length}/{LIMITS.maxPinnedProjects} · drag to reorder
          </span>
        </div>
        {pinned.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Pin up to {LIMITS.maxPinnedProjects} projects to show them first on your profile.
          </p>
        ) : (
          // Remount when the server's pinned set changes so local order resets.
          <PinnedList key={pinned.map((c) => c.id).join()} initial={pinned} username={username} />
        )}
      </section>

      {others.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">All projects</h2>
          <ul className="flex flex-col divide-y rounded-md border">
            {others.map((card) => (
              <li key={card.id}>
                <Row card={card} username={username} canPin={canPinMore} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function PinnedList({ initial, username }: { initial: ProjectCard[]; username: string | null }) {
  const [items, setItems] = useState(initial);
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const prev = items;
    const next = arrayMove(
      items,
      items.findIndex((c) => c.id === active.id),
      items.findIndex((c) => c.id === over.id),
    );
    setItems(next);
    startTransition(async () => {
      const res = await reorderPinned(next.map((c) => c.id));
      if (!res.ok) {
        setItems(prev);
        toast.error(res.error);
      }
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col divide-y rounded-md border">
          {items.map((card) => (
            <SortableRow key={card.id} card={card} username={username} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ card, username }: { card: ProjectCard; username: string | null }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("bg-background", isDragging && "relative z-10 shadow-md")}
    >
      <Row
        card={card}
        username={username}
        canPin
        handle={
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${card.title}`}
            className="flex h-10 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent active:cursor-grabbing"
          >
            <GripVertical className="size-4" />
          </button>
        }
      />
    </li>
  );
}

function Row({
  card,
  username,
  canPin,
  handle,
}: {
  card: ProjectCard;
  username: string | null;
  canPin: boolean;
  handle?: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  function togglePin() {
    startTransition(async () => {
      const res = await setPinned(card.id, !card.pinned);
      if (!res.ok) toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-3">
      {handle}
      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
        {card.cover ? (
          <Image src={card.cover.url} alt="" width={56} height={56} className="size-full object-cover" unoptimized />
        ) : (
          <span className="text-[0.65rem] text-muted-foreground">No image</span>
        )}
      </div>

      <div className="min-w-0 flex-1 basis-40">
        <p className="truncate font-medium">{card.title}</p>
        <p className="truncate text-sm text-muted-foreground">{card.tagline || "No tagline yet"}</p>
        <p className="text-xs text-muted-foreground">Updated {card.updatedAt.toLocaleDateString()}</p>
      </div>

      <div className="flex w-full shrink-0 items-center justify-end gap-1 sm:w-auto">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending || (!card.pinned && !canPin)}
          title={!card.pinned && !canPin ? `You can pin up to ${LIMITS.maxPinnedProjects} projects` : undefined}
          onClick={togglePin}
        >
          {card.pinned ? <PinOff /> : <Pin />}
          {card.pinned ? "Unpin" : "Pin"}
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/projects/${card.id}/edit`}>Edit</Link>
        </Button>
        {username && (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/${username}/${card.slug}`}>View</Link>
          </Button>
        )}
        <DeleteProjectButton id={card.id} title={card.title} />
      </div>
    </div>
  );
}
