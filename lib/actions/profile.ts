"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { requireUserForMutation } from "@/lib/session";
import { deleteObject } from "@/lib/storage";
import type { ActionResult } from "@/lib/types";
import { profileFormSchema, type ProfileFormInput } from "@/lib/validation/profile";

const GENERIC_ERROR = "Check the highlighted fields.";
const USERNAME_TAKEN = "That username is taken.";

/** Postgres unique_violation, as thrown by the neon-http driver. */
function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: unknown }).code === "23505";
}

function revalidateForProfile(oldUsername: string, newUsername: string) {
  revalidatePath(`/${oldUsername}`);
  if (newUsername !== oldUsername) revalidatePath(`/${newUsername}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
}

export async function updateProfile(input: ProfileFormInput): Promise<ActionResult<{ username: string }>> {
  const user = await requireUserForMutation();

  const parsed = profileFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: GENERIC_ERROR, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const current = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.id),
    columns: { username: true },
  });
  if (!current) return { ok: false, error: "Profile not found." };

  const clash = await db.query.profiles.findFirst({
    where: and(eq(profiles.username, data.username), ne(profiles.userId, user.id)),
    columns: { userId: true },
  });
  if (clash) {
    return { ok: false, error: GENERIC_ERROR, fieldErrors: { username: [USERNAME_TAKEN] } };
  }

  try {
    await db
      .update(profiles)
      .set({
        username: data.username,
        displayName: data.displayName,
        bio: data.bio,
        school: data.school,
        githubUrl: data.githubUrl,
        linkedinUrl: data.linkedinUrl,
        xUrl: data.xUrl,
        websiteUrl: data.websiteUrl,
        email: data.email,
        resumeUrl: data.resumeUrl,
        skills: data.skills,
        openToWork: data.openToWork,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, user.id));
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false, error: GENERIC_ERROR, fieldErrors: { username: [USERNAME_TAKEN] } };
    }
    throw err;
  }

  revalidateForProfile(current.username, data.username);
  return { ok: true, data: { username: data.username } };
}

export async function removeAvatar(): Promise<ActionResult> {
  const user = await requireUserForMutation();

  const current = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.id),
    columns: { avatarKey: true, username: true },
  });
  if (!current) return { ok: false, error: "Profile not found." };
  if (!current.avatarKey) return { ok: true, data: undefined };

  const oldKey = current.avatarKey;
  await db.update(profiles).set({ avatarKey: null, updatedAt: new Date() }).where(eq(profiles.userId, user.id));
  await deleteObject(oldKey);

  revalidatePath(`/${current.username}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return { ok: true, data: undefined };
}
