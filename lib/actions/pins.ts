"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, max } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { LIMITS } from "@/lib/limits";
import { getProfileByUserId } from "@/lib/queries/profiles";
import { requireUserForMutation } from "@/lib/session";
import type { ActionResult } from "@/lib/types";

async function revalidatePins(userId: string) {
  revalidatePath("/dashboard");
  const profile = await getProfileByUserId(userId);
  if (profile) revalidatePath(`/${profile.username}`);
}

async function pinnedIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.pinned, true)))
    .orderBy(asc(projects.pinPosition), asc(projects.createdAt));
  return rows.map((r) => r.id);
}

/** Rewrites pin positions to 0..n-1 in the given order. Ids must belong to `userId`. */
async function writePinOrder(userId: string, ids: string[]) {
  if (ids.length === 0) return;
  const [first, ...rest] = ids.map((id, i) =>
    db
      .update(projects)
      .set({ pinPosition: i })
      .where(and(eq(projects.id, id), eq(projects.userId, userId))),
  );
  await db.batch([first, ...rest]);
}

export async function setPinned(projectId: string, pinned: boolean): Promise<ActionResult> {
  const user = await requireUserForMutation();
  const parsed = z.object({ projectId: z.uuid(), pinned: z.boolean() }).safeParse({ projectId, pinned });
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, user.id)),
    columns: { pinned: true },
  });
  if (!project) return { ok: false, error: "Project not found." };
  if (project.pinned === pinned) return { ok: true, data: undefined };

  if (pinned) {
    const current = await pinnedIds(user.id);
    if (current.length >= LIMITS.maxPinnedProjects) {
      return { ok: false, error: `You can pin up to ${LIMITS.maxPinnedProjects} projects. Unpin one first.` };
    }
    const [{ top }] = await db
      .select({ top: max(projects.pinPosition) })
      .from(projects)
      .where(and(eq(projects.userId, user.id), eq(projects.pinned, true)));
    await db
      .update(projects)
      .set({ pinned: true, pinPosition: (top ?? -1) + 1 })
      .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));
  } else {
    await db
      .update(projects)
      .set({ pinned: false, pinPosition: null })
      .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));
    await writePinOrder(user.id, await pinnedIds(user.id));
  }

  await revalidatePins(user.id);
  return { ok: true, data: undefined };
}

export async function reorderPinned(orderedIds: string[]): Promise<ActionResult> {
  const user = await requireUserForMutation();
  const parsed = z.array(z.uuid()).max(LIMITS.maxPinnedProjects).safeParse(orderedIds);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const current = await pinnedIds(user.id);
  const same =
    current.length === parsed.data.length &&
    new Set(parsed.data).size === parsed.data.length &&
    parsed.data.every((id) => current.includes(id));
  if (!same) return { ok: false, error: "Pinned projects changed. Refresh and try again." };

  await writePinOrder(user.id, parsed.data);
  await revalidatePins(user.id);
  return { ok: true, data: undefined };
}
