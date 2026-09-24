import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { profiles, projectMedia, projects } from "@/lib/db/schema";
import { isImageType, LIMITS } from "@/lib/limits";
import { getProfileByUserId } from "@/lib/queries/profiles";
import { countMedia, ownsProject } from "@/lib/queries/projects";
import { toMediaItem } from "@/lib/queries/mappers";
import { requireUserForMutation, UnauthorizedError } from "@/lib/session";
import { confirmUpload, deleteObject, publicUrl, StorageError } from "@/lib/storage";

const confirmSchema = z.discriminatedUnion("purpose", [
  z.object({ purpose: z.literal("avatar"), key: z.string().min(1).max(1024) }),
  z.object({ purpose: z.literal("media"), projectId: z.uuid(), key: z.string().min(1).max(1024) }),
]);

function errorResponse(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: Request) {
  let user;
  try {
    user = await requireUserForMutation();
  } catch (err) {
    if (err instanceof UnauthorizedError) return errorResponse(401, "Not signed in.");
    throw err;
  }

  const body = await req.json().catch(() => null);
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) return errorResponse(400, "Invalid upload request.");
  const input = parsed.data;

  if (!input.key.startsWith(`users/${user.id}/`)) {
    return errorResponse(403, "This upload does not belong to you.");
  }

  if (input.purpose === "avatar") {
    let confirmed;
    try {
      confirmed = await confirmUpload(input.key, { userId: user.id, purpose: "avatar" });
    } catch (err) {
      if (err instanceof StorageError) return errorResponse(err.status, err.message);
      console.error("POST /api/uploads/confirm (avatar) failed", err);
      return errorResponse(500, "Failed to confirm upload.");
    }

    const [existing] = await db
      .select({ avatarKey: profiles.avatarKey })
      .from(profiles)
      .where(eq(profiles.userId, user.id));
    if (!existing) {
      await deleteObject(confirmed.key);
      return errorResponse(404, "Profile not found.");
    }
    const oldKey = existing.avatarKey;

    await db
      .update(profiles)
      .set({ avatarKey: confirmed.key, updatedAt: new Date() })
      .where(eq(profiles.userId, user.id));

    if (oldKey && oldKey !== confirmed.key) {
      await deleteObject(oldKey);
    }

    revalidatePath("/dashboard", "layout");
    const profile = await getProfileByUserId(user.id);
    if (profile) revalidatePath(`/${profile.username}`);

    return NextResponse.json({ avatarUrl: publicUrl(confirmed.key) });
  }

  const owns = await ownsProject(input.projectId, user.id);
  if (!owns) return errorResponse(404, "Project not found.");

  const existingCount = await countMedia(input.projectId);
  if (existingCount >= LIMITS.maxMediaPerProject) {
    return errorResponse(403, `Projects can have at most ${LIMITS.maxMediaPerProject} media items.`);
  }

  let confirmed;
  try {
    confirmed = await confirmUpload(input.key, { userId: user.id, purpose: "media" });
  } catch (err) {
    if (err instanceof StorageError) return errorResponse(err.status, err.message);
    console.error("POST /api/uploads/confirm (media) failed", err);
    return errorResponse(500, "Failed to confirm upload.");
  }

  const hasCover = await db.query.projectMedia.findFirst({
    where: and(eq(projectMedia.projectId, input.projectId), eq(projectMedia.isCover, true)),
    columns: { id: true },
  });

  const [row] = await db
    .insert(projectMedia)
    .values({
      projectId: input.projectId,
      userId: user.id,
      key: confirmed.key,
      kind: isImageType(confirmed.contentType) ? "image" : "video",
      contentType: confirmed.contentType,
      size: confirmed.size,
      position: existingCount,
      isCover: !hasCover && isImageType(confirmed.contentType),
    })
    .returning();

  revalidatePath("/dashboard", "layout");
  const [project, profile] = await Promise.all([
    db.query.projects.findFirst({ where: eq(projects.id, input.projectId), columns: { slug: true } }),
    getProfileByUserId(user.id),
  ]);
  if (project && profile) revalidatePath(`/${profile.username}/${project.slug}`);

  return NextResponse.json({ media: toMediaItem(row) });
}
