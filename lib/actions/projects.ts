"use server";

import type { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectLinks, projectMedia, projects } from "@/lib/db/schema";
import { requireUserForMutation } from "@/lib/session";
import { countProjects } from "@/lib/queries/projects";
import { getProfileByUserId } from "@/lib/queries/profiles";
import { deleteObject } from "@/lib/storage";
import { LIMITS } from "@/lib/limits";
import type { ActionResult } from "@/lib/types";
import { projectIdSchema, projectInputSchema, type ProjectInput } from "@/lib/validation/project";

/** Maps every zod issue to its dotted path, so array items (e.g. "links.0.url") get their own error. */
function fieldErrorsFrom(error: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!key) continue;
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
  return base || "project";
}

export async function createProject(input: ProjectInput): Promise<ActionResult<{ id: string; slug: string }>> {
  const user = await requireUserForMutation();

  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const existing = await countProjects(user.id);
  if (existing >= LIMITS.maxProjectsPerUser) {
    return { ok: false, error: `You've reached the limit of ${LIMITS.maxProjectsPerUser} projects.` };
  }

  const { links, ...rest } = parsed.data;
  const base = slugify(rest.title);

  for (let attempt = 0; attempt < 50; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const inserted = await db
      .insert(projects)
      .values({ userId: user.id, slug, ...rest })
      .onConflictDoNothing({ target: [projects.userId, projects.slug] })
      .returning({ id: projects.id, slug: projects.slug });

    if (inserted.length > 0) {
      const project = inserted[0];
      if (links.length > 0) {
        await db
          .insert(projectLinks)
          .values(links.map((l, idx) => ({ projectId: project.id, label: l.label, url: l.url, position: idx })));
      }
      revalidatePath("/dashboard");
      return { ok: true, data: { id: project.id, slug: project.slug } };
    }
  }

  return { ok: false, error: "Could not create the project. Try a different title." };
}

export async function updateProject(id: string, input: ProjectInput): Promise<ActionResult> {
  const user = await requireUserForMutation();

  const idCheck = projectIdSchema.safeParse(id);
  if (!idCheck.success) return { ok: false, error: "Invalid project." };

  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const owned = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, user.id)),
    columns: { slug: true },
  });
  if (!owned) return { ok: false, error: "Project not found." };

  const { links, ...rest } = parsed.data;
  const linkRows = links.map((l, idx) => ({ projectId: id, label: l.label, url: l.url, position: idx }));
  const updateStmt = db
    .update(projects)
    .set({ ...rest, updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.userId, user.id)));
  const deleteLinksStmt = db.delete(projectLinks).where(eq(projectLinks.projectId, id));

  if (linkRows.length > 0) {
    await db.batch([updateStmt, deleteLinksStmt, db.insert(projectLinks).values(linkRows)]);
  } else {
    await db.batch([updateStmt, deleteLinksStmt]);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/projects/${id}/edit`);
  const profile = await getProfileByUserId(user.id);
  if (profile) revalidatePath(`/${profile.username}/${owned.slug}`);

  return { ok: true, data: undefined };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const user = await requireUserForMutation();

  const idCheck = projectIdSchema.safeParse(id);
  if (!idCheck.success) return { ok: false, error: "Invalid project." };

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, user.id)),
    columns: { slug: true },
  });
  if (!project) return { ok: false, error: "Project not found." };

  const mediaRows = await db
    .select({ key: projectMedia.key })
    .from(projectMedia)
    .where(and(eq(projectMedia.projectId, id), eq(projectMedia.userId, user.id)));

  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, user.id)));

  for (const { key } of mediaRows) {
    try {
      await deleteObject(key);
    } catch (err) {
      console.error(`Failed to delete media object ${key}`, err);
    }
  }

  revalidatePath("/dashboard");
  const profile = await getProfileByUserId(user.id);
  if (profile) revalidatePath(`/${profile.username}/${project.slug}`);

  return { ok: true, data: undefined };
}
