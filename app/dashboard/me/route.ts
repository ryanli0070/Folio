import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getProfileByUserId } from "@/lib/queries/profiles";

/**
 * Post-sign-in landing: forwards to the user's public profile (their username isn't known before sign-in).
 * A route handler, not a page, so it isn't wrapped by the dashboard's streaming loading UI and returns a real redirect.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/", request.url));
  const profile = await getProfileByUserId(user.id);
  return NextResponse.redirect(new URL(profile ? `/${profile.username}` : "/dashboard", request.url));
}
