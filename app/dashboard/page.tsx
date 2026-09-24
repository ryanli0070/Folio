import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { LIMITS } from "@/lib/limits";
import { requireUser } from "@/lib/session";
import { getProjectCards } from "@/lib/queries/projects";
import { getProfileByUserId } from "@/lib/queries/profiles";

export default async function DashboardPage() {
  const user = await requireUser();
  const [cards, profile] = await Promise.all([getProjectCards(user.id), getProfileByUserId(user.id)]);
  const atLimit = cards.length >= LIMITS.maxProjectsPerUser;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Your projects</h1>
          <p className="text-sm text-muted-foreground">
            {cards.length} of {LIMITS.maxProjectsPerUser} projects
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {atLimit ? (
            <Button disabled>
              <Plus /> New project
            </Button>
          ) : (
            <Button asChild>
              <Link href="/dashboard/projects/new">
                <Plus /> New project
              </Link>
            </Button>
          )}
          {atLimit && <p className="text-xs text-muted-foreground">You&apos;ve reached the {LIMITS.maxProjectsPerUser}-project limit.</p>}
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-md border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            You haven&apos;t added any projects yet. Create your first one to start building your Folio.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/projects/new">
              <Plus /> New project
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col divide-y rounded-md border">
          {cards.map((card) => (
            <li key={card.id} className="flex items-center gap-3 p-3">
              {/* Pin controls placeholder — lead adds pin/unpin + drag reorder here. */}
              <div className="w-5 shrink-0" aria-hidden />

              <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                {card.cover ? (
                  <Image src={card.cover.url} alt="" width={56} height={56} className="size-full object-cover" unoptimized />
                ) : (
                  <span className="text-[0.65rem] text-muted-foreground">No image</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{card.title}</p>
                <p className="truncate text-sm text-muted-foreground">{card.tagline || "No tagline yet"}</p>
                <p className="text-xs text-muted-foreground">Updated {card.updatedAt.toLocaleDateString()}</p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/projects/${card.id}/edit`}>Edit</Link>
                </Button>
                {profile && (
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/${profile.username}/${card.slug}`}>View</Link>
                  </Button>
                )}
                <DeleteProjectButton id={card.id} title={card.title} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
