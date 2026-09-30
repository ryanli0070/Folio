import { NextResponse } from "next/server";
import { z } from "zod";
import { LIMITS } from "@/lib/limits";
import { countMedia, ownsProject } from "@/lib/queries/projects";
import { requireUserForMutation, UnauthorizedError } from "@/lib/session";
import { recordUploadIntent, uploadBlockedReason } from "@/lib/uploads";
import { createUploadUrl, StorageError } from "@/lib/storage";

const presignSchema = z.discriminatedUnion("purpose", [
  z.object({
    purpose: z.literal("avatar"),
    contentType: z.string().min(1).max(255),
    size: z.number().int().positive(),
  }),
  z.object({
    purpose: z.literal("media"),
    projectId: z.uuid(),
    contentType: z.string().min(1).max(255),
    size: z.number().int().positive(),
  }),
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
  const parsed = presignSchema.safeParse(body);
  if (!parsed.success) return errorResponse(400, "Invalid upload request.");
  const input = parsed.data;

  if (input.purpose === "media") {
    const owns = await ownsProject(input.projectId, user.id);
    if (!owns) return errorResponse(404, "Project not found.");
    const existing = await countMedia(input.projectId);
    if (existing >= LIMITS.maxMediaPerProject) {
      return errorResponse(403, `Projects can have at most ${LIMITS.maxMediaPerProject} media items.`);
    }
  }

  const blocked = await uploadBlockedReason(user.id, input.size);
  if (blocked) return errorResponse(...blocked);

  try {
    const result = await createUploadUrl({
      userId: user.id,
      purpose: input.purpose,
      contentType: input.contentType,
      size: input.size,
    });
    await recordUploadIntent(user.id, result.key, input.purpose, input.size);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof StorageError) return errorResponse(err.status, err.message);
    console.error("POST /api/uploads/presign failed", err);
    return errorResponse(500, "Failed to create upload URL.");
  }
}
