import "server-only";
import { cache } from "react";
import { and, asc, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectLinks, projectMedia, projects } from "@/lib/db/schema";
import type { ProjectCard, ProjectDetail } from "@/lib/types";
import { pickCover, toLinkItem, toMediaItem } from "./mappers";

/**
 * All projects for a user, ordered: pinned by pinPosition first, then unpinned newest first.
 */
export const getProjectCards = cache(async (userId: string): Promise<ProjectCard[]> => {
  const rows = await db.query.projects.findMany({
    where: eq(projects.userId, userId),
    columns: { description: false, collaborators: false, userId: false },
    with: { media: { orderBy: [asc(projectMedia.position)] } },
    orderBy: [desc(projects.createdAt)],
  });
  const cards: ProjectCard[] = rows.map(({ media, ...p }) => ({ ...p, cover: pickCover(media.map(toMediaItem)) }));
  const pinned = cards.filter((c) => c.pinned).sort((a, b) => (a.pinPosition ?? 0) - (b.pinPosition ?? 0));
  const rest = cards.filter((c) => !c.pinned);
  return [...pinned, ...rest];
});

async function loadDetail(where: ReturnType<typeof and>): Promise<ProjectDetail | null> {
  const row = await db.query.projects.findFirst({
    where,
    with: {
      links: { orderBy: [asc(projectLinks.position)] },
      media: { orderBy: [asc(projectMedia.position)] },
    },
  });
  if (!row) return null;
  return { ...row, links: row.links.map(toLinkItem), media: row.media.map(toMediaItem) };
}

/** Public project lookup. */
export const getProjectBySlug = cache(async (userId: string, slug: string) =>
  loadDetail(and(eq(projects.userId, userId), eq(projects.slug, slug))),
);

/** Owner-scoped lookup for edit pages and mutations. Returns null if not owned. */
export const getOwnedProject = cache(async (projectId: string, userId: string) =>
  loadDetail(and(eq(projects.id, projectId), eq(projects.userId, userId))),
);

export async function countProjects(userId: string): Promise<number> {
  const [r] = await db.select({ n: count() }).from(projects).where(eq(projects.userId, userId));
  return r?.n ?? 0;
}

export async function countMedia(projectId: string): Promise<number> {
  const [r] = await db.select({ n: count() }).from(projectMedia).where(eq(projectMedia.projectId, projectId));
  return r?.n ?? 0;
}

/** Ownership check used by mutations: returns true only if `projectId` belongs to `userId`. */
export async function ownsProject(projectId: string, userId: string): Promise<boolean> {
  const row = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
    columns: { id: true },
  });
  return !!row;
}
