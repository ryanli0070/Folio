import { notFound } from "next/navigation";
import { getProfileByUserId } from "@/lib/queries/profiles";
import { requireUser } from "@/lib/session";
import { AvatarEditor } from "./avatar-editor";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Edit profile" };

export default async function DashboardProfilePage() {
  const user = await requireUser();
  const profile = await getProfileByUserId(user.id);
  if (!profile) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Edit profile</h1>
        <p className="text-sm text-muted-foreground">This is what shows on your public page at /{profile.username}.</p>
      </div>
      <AvatarEditor
        username={profile.username}
        avatarUrl={profile.avatarUrl}
        githubAvatarUrl={user.image}
        hasCustomAvatar={!!profile.avatarKey}
      />
      <ProfileForm profile={profile} />
    </div>
  );
}
