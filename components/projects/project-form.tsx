"use client";

import { useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LIMITS } from "@/lib/limits";
import { createProject, updateProject } from "@/lib/actions/projects";
import { setCover } from "@/lib/actions/media";
import { uploadFile } from "@/lib/storage/client";
import { Markdown } from "./markdown";
import { TagInput } from "@/components/tag-input";
import { LinkEditor, type LinkDraft } from "./link-editor";
import { PendingMediaPicker, type PendingMedia } from "./pending-media-picker";

export type ProjectFormValues = {
  title: string;
  tagline: string;
  description: string;
  stack: string[];
  collaborators: string[];
  links: LinkDraft[];
};

const EMPTY_VALUES: ProjectFormValues = {
  title: "",
  tagline: "",
  description: "",
  stack: [],
  collaborators: [],
  links: [],
};

type ProjectFormProps = {
  /** Owner's username; saving redirects to their public profile. */
  username: string;
} & (
  | { mode: "create" }
  | {
      mode: "edit";
      projectId: string;
      initialValues: ProjectFormValues;
      /** Rendered above the submit button (the media uploader). */
      media?: ReactNode;
    }
);

export function ProjectForm(props: ProjectFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ProjectFormValues>(props.mode === "edit" ? props.initialValues : EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [isPending, startTransition] = useTransition();
  const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Warn before leaving mid-upload; files not yet uploaded would be lost.
  useEffect(() => {
    if (!uploadStatus) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [uploadStatus]);

  /** Uploads the files picked on the New project form to the just-created project. Returns how many failed. */
  async function uploadPendingMedia(projectId: string): Promise<number> {
    let failed = 0;
    let coverMediaId: string | null = null;
    for (const [i, item] of pendingMedia.entries()) {
      setUploadStatus(`Uploading ${i + 1} of ${pendingMedia.length}…`);
      setUploadProgress((p) => ({ ...p, [item.id]: 0 }));
      try {
        const { media } = await uploadFile(item.file, { purpose: "media", projectId }, (fraction) =>
          setUploadProgress((p) => ({ ...p, [item.id]: fraction })),
        );
        if (item.isCover) coverMediaId = media.id;
      } catch (err) {
        failed += 1;
        toast.error(`${item.file.name}: ${err instanceof Error ? err.message : "upload failed."}`);
      }
    }
    // The first upload becomes the thumbnail automatically; apply the user's pick if it differs.
    if (coverMediaId) await setCover(projectId, coverMediaId);
    return failed;
  }

  function set<K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});

    startTransition(async () => {
      if (props.mode === "create") {
        const result = await createProject(values);
        if (!result.ok) {
          setFieldErrors(result.fieldErrors ?? {});
          toast.error(result.error);
          return;
        }
        const failed = pendingMedia.length > 0 ? await uploadPendingMedia(result.data.id) : 0;
        setUploadStatus(null);
        if (failed > 0) {
          // Send them where they can retry instead of to the profile.
          toast.warning(`Project created, but ${failed} file(s) didn't upload. Add them again below.`);
          router.push(`/dashboard/projects/${result.data.id}/edit`);
          return;
        }
        toast.success("Project created.");
        router.push(`/${props.username}`);
        return;
      }

      const result = await updateProject(props.projectId, values);
      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        return;
      }
      toast.success("Saved.");
      router.push(`/${props.username}`);
    });
  }

  const titleError = fieldErrors.title?.[0];
  const taglineError = fieldErrors.tagline?.[0];
  const descriptionError = fieldErrors.description?.[0];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          maxLength={LIMITS.titleMaxLength}
          aria-invalid={!!titleError}
          required
        />
        {titleError && <p className="text-xs text-destructive">{titleError}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tagline">Tagline</Label>
        <Input
          id="tagline"
          value={values.tagline}
          onChange={(e) => set("tagline", e.target.value)}
          maxLength={LIMITS.taglineMaxLength}
          placeholder="One line about the project"
          aria-invalid={!!taglineError}
        />
        {taglineError && <p className="text-xs text-destructive">{taglineError}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Tech stack</Label>
        <TagInput
          value={values.stack}
          onChange={(v) => set("stack", v)}
          max={LIMITS.maxStackTags}
          maxTagLength={LIMITS.tagMaxLength}
          placeholder="Add a technology and press Enter"
          aria-label="Tech stack"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Collaborators</Label>
        <TagInput
          value={values.collaborators}
          onChange={(v) => set("collaborators", v)}
          max={LIMITS.maxCollaborators}
          placeholder="Name or @github-username, then Enter"
          aria-label="Collaborators"
        />
        <p className="text-xs text-muted-foreground">Use @username (or paste a GitHub profile URL) to link their GitHub.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Links</Label>
        <LinkEditor value={values.links} onChange={(v) => set("links", v)} max={LIMITS.maxLinksPerProject} fieldErrors={fieldErrors} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Description</Label>
        <Tabs defaultValue="write">
          <TabsList>
            <TabsTrigger value="write">Write</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="write">
            <Textarea
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              maxLength={LIMITS.descriptionMaxLength}
              rows={14}
              placeholder="Markdown supported: headings, lists, links, code blocks…"
              aria-invalid={!!descriptionError}
              className="font-mono"
            />
          </TabsContent>
          <TabsContent value="preview">
            <div className="rounded-md border p-4">
              {values.description.trim() ? (
                <Markdown>{values.description}</Markdown>
              ) : (
                <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
        {descriptionError && <p className="text-xs text-destructive">{descriptionError}</p>}
      </div>

      {props.mode === "edit" && props.media}

      {props.mode === "create" && (
        <div className="flex flex-col gap-1.5">
          <Label>Images and videos</Label>
          <PendingMediaPicker
            value={pendingMedia}
            onChange={setPendingMedia}
            progress={uploadProgress}
            disabled={isPending}
          />
        </div>
      )}

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? (uploadStatus ?? "Saving…") : props.mode === "create" ? "Create project" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
