import Link from "next/link";
import { ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ProjectCard as ProjectCardData } from "@/lib/types";
import { MediaThumb } from "@/components/media/media-thumb";

export type ProjectCardProps = { card: ProjectCardData; username: string };

/** A single project preview card, used in profile grids and dashboard lists. */
export function ProjectCard({ card, username }: ProjectCardProps) {
  return (
    <Link href={`/${username}/${card.slug}`} className="group block h-full">
      <Card className="h-full gap-0 py-0 transition-shadow hover:shadow-sm hover:ring-foreground/20">
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
          <h3 className="font-medium leading-snug group-hover:text-link">{card.title}</h3>
          {card.tagline && <p className="line-clamp-2 text-sm text-muted-foreground">{card.tagline}</p>}
          {card.stack.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {card.stack.slice(0, 6).map((tech) => (
                <Badge key={tech} variant="outline" className="font-normal text-muted-foreground">
                  {tech}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
