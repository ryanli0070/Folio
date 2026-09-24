"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { projectMedia, projects } from "@/lib/db/schema";
import { getProfileByUserId } from "@/lib/queries/profiles";
import { ownsProject } from "@/lib/queries/projects";
import { requireUserForMutation } from "@/lib/session";
import { deleteObject } from "@/lib/storage";
import type { ActionResult } from "@/lib/types";

/** Casts a non-empty array into the `[T, ...T[]]` tuple `db.batch` requires. */
function asBatch<T>(items: T[]): [T, ...T[]] {
  if (items.length === 0) throw new Error("asBatch requires at least one item");
  return items as [T, ...T[]];
}

async function revalidateProject(userId: string, projectId: string) {
  const [project, profile] = await Promise.all([
    db.query.projects.findFirst({ where: eq(projects.id, projectId), columns: { slug: true } }),
    getProfileByUserId(userId),
  ]);
  if (project && profile) revalidatePath(`/${profile.username}/${project.slug}`);
  revalidatePath("/dashboard", "layout");
}

const idSchema = z.uuid();
const orderedIdsSchema = z.array(z.uuid()).min(1);

export async function reorderMedia(projectId: string, orderedIds: string[]): Promise<ActionResult> {
  const user = await requireUserForMutation();

  const parsedProjectId = idSchema.safeParse(projectId);
  const parsedOrderedIds = orderedIdsSchema.safeParse(orderedIds);
  if (!parsedProjectId.success || !parsedOrderedIds.success) {
    return { ok: false, error: "Invalid request." };
  }

  const owns = await ownsProject(projectId, user.id);
  if (!owns) return { ok: false, error: "Project not found." };

  const existing = await db
    .select({ id: projectMedia.id })
    .from(projectMedia)
    .where(eq(projectMedia.projectId, projectId));
  const existingIds = new Set(existing.map((r) => r.id));
  const incomingIds = new Set(orderedIds);
  const matches = existingIds.size === incomingIds.size && [...existingIds].every((id) => incomingIds.has(id));
  if (!matches) {
    return { ok: false, error: "Media list is out of date. Refresh and try again." };
  }

  await db.batch(
    asBatch(
      orderedIds.map((id, position) =>
        db
          .update(projectMedia)
          .set({ position })
          .where(and(eq(projectMedia.id, id), eq(projectMedia.projectId, projectId))),
      ),
    ),
  );

  await revalidateProject(user.id, projectId);
  return { ok: true, data: undefined };
}

export async function setCover(projectId: string, mediaId: string): Promise<ActionResult> {
  const user = await requireUserForMutation();

  const parsed = z.object({ projectId: idSchema, mediaId: idSchema }).safeParse({ projectId, mediaId });
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const owns = await ownsProject(projectId, user.id);
  if (!owns) return { ok: false, error: "Project not found." };

  const target = await db.query.projectMedia.findFirst({
    where: and(eq(projectMedia.id, mediaId), eq(projectMedia.projectId, projectId)),
    columns: { id: true },
  });
  if (!target) return { ok: false, error: "Media not found." };

  await db.batch(
    asBatch([
      db
        .update(projectMedia)
        .set({ isCover: false })
        .where(and(eq(projectMedia.projectId, projectId), eq(projectMedia.isCover, true))),
      db.update(projectMedia).set({ isCover: true }).where(eq(projectMedia.id, mediaId)),
    ]),
  );

  await revalidateProject(user.id, projectId);
  return { ok: true, data: undefined };
}

export async function deleteMedia(projectId: string, mediaId: string): Promise<ActionResult> {
  const user = await requireUserForMutation();

  const parsed = z.object({ projectId: idSchema, mediaId: idSchema }).safeParse({ projectId, mediaId });
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const owns = await ownsProject(projectId, user.id);
  if (!owns) return { ok: false, error: "Project not found." };

  const target = await db.query.projectMedia.findFirst({
    where: and(eq(projectMedia.id, mediaId), eq(projectMedia.projectId, projectId)),
  });
  if (!target) return { ok: false, error: "Media not found." };

  await db
    .delete(projectMedia)
    .where(and(eq(projectMedia.id, mediaId), eq(projectMedia.projectId, projectId), eq(projectMedia.userId, user.id)));
  await deleteObject(target.key);

  const remaining = await db.query.projectMedia.findMany({
    where: eq(projectMedia.projectId, projectId),
    orderBy: [asc(projectMedia.position)],
  });

  const statements = remaining.map((m, position) => db.update(projectMedia).set({ position }).where(eq(projectMedia.id, m.id)));

  if (target.isCover) {
    const newCover = remaining.find((m) => m.kind === "image");
    if (newCover) {
      statements.push(db.update(projectMedia).set({ isCover: true }).where(eq(projectMedia.id, newCover.id)));
    }
  }

  if (statements.length > 0) {
    await db.batch(asBatch(statements));
  }

  await revalidateProject(user.id, projectId);
  return { ok: true, data: undefined };
}
