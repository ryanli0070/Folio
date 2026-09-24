import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectList } from "@/components/dashboard/project-list";
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
        <ProjectList cards={cards} username={profile?.username ?? null} />
      )}
    </div>
  );
}
