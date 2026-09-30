import Link from "next/link";
import { ImageOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ProjectCard as ProjectCardData } from "@/lib/types";
import { MediaThumb } from "@/components/media/media-thumb";
import { StackChips } from "@/components/profile/stack-chips";
import { LIMITS } from "@/lib/limits";

export type ProjectCardProps = { card: ProjectCardData; username: string };

/** A single project preview card, used in profile grids and dashboard lists. */
export function ProjectCard({ card, username }: ProjectCardProps) {
  return (
    <Card className="group relative h-full gap-0 py-0 transition-shadow hover:shadow-sm hover:ring-foreground/20 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring">
      <div className="relative aspect-video w-full overflow-hidden bg-canvas-subtle">
        {card.cover ? (
          <MediaThumb item={card.cover} sizes="(min-width: 768px) 45vw, 100vw" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-6" aria-hidden />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-4">
        <h3 className="font-medium leading-snug group-hover:text-link">
          {/* Stretched link: the whole card is clickable, while the stack toggle stays a separate button. */}
          <Link href={`/${username}/${card.slug}`} className="outline-none after:absolute after:inset-0">
            {card.title}
          </Link>
        </h3>
        {card.tagline && <p className="line-clamp-2 text-sm text-muted-foreground">{card.tagline}</p>}
        {card.stack.length > 0 && <StackChips stack={card.stack} preview={LIMITS.cardStackPreview} />}
      </div>
    </Card>
  );
}
