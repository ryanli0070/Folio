import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { getProfileByUserId } from "@/lib/queries/profiles";
import { ProjectForm } from "@/components/projects/project-form";

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage() {
  const user = await requireUser();
  const profile = await getProfileByUserId(user.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New project</h1>
      <ProjectForm mode="create" username={profile?.username ?? ""} />
    </div>
  );
}
