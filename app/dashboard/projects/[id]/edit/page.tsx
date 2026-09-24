import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { getOwnedProject } from "@/lib/queries/projects";
import { ProjectForm } from "@/components/projects/project-form";
import { MediaUploader } from "@/components/media/media-uploader";

export const metadata: Metadata = { title: "Edit project" };

export default async function EditProjectPage(props: PageProps<"/dashboard/projects/[id]/edit">) {
  const user = await requireUser();
  const { id } = await props.params;

  if (!z.uuid().safeParse(id).success) notFound();

  const project = await getOwnedProject(id, user.id);
  if (!project) notFound();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Edit project</h1>
      <ProjectForm
        mode="edit"
        projectId={project.id}
        initialValues={{
          title: project.title,
          tagline: project.tagline,
          description: project.description,
          stack: project.stack,
          collaborators: project.collaborators,
          links: project.links.map((l) => ({ label: l.label, url: l.url })),
        }}
      />
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Media</h2>
        <MediaUploader projectId={project.id} initialMedia={project.media} />
      </div>
    </div>
  );
}
