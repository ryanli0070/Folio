import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type SessionUser = { id: string; name: string | null; image: string | null };

/** Current signed-in user, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  const u = session?.user;
  if (!u?.id) return null;
  return { id: u.id, name: u.name ?? null, image: u.image ?? null };
}

/** Use in pages/layouts: redirects to "/" when signed out. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return user;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Not signed in");
  }
}

/** Use in server actions / route handlers: throws instead of redirecting. */
export async function requireUserForMutation(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}
