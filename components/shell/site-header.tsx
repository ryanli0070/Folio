import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getProfileByUserId } from "@/lib/queries/profiles";
import { SignInButton, signOutAction } from "./auth-buttons";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const profile = user ? await getProfileByUserId(user.id) : null;

  return (
    <header className="border-b bg-canvas-subtle">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link href={profile ? `/${profile.username}` : "/"} className="flex items-center gap-2 font-semibold">
          <span aria-hidden className="grid size-7 place-items-center rounded-md bg-foreground text-sm text-background">
            F
          </span>
          Folio
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {profile ? (
            <UserMenu username={profile.username} avatarUrl={profile.avatarUrl} signOutAction={signOutAction} />
          ) : (
            <SignInButton size="sm" />
          )}
        </div>
      </div>
    </header>
  );
}
