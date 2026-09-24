import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { ProjectForm } from "@/components/projects/project-form";

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage() {
  await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New project</h1>
      <ProjectForm mode="create" />
      <p className="text-sm text-muted-foreground">Save the project to add images and videos.</p>
    </div>
  );
}
