import { z } from "zod";
import { normalizeCollaborator } from "@/lib/collaborators";
import { LIMITS } from "@/lib/limits";
import { httpUrl, tagListSchema } from "@/lib/validation/common";

export const collaboratorNameSchema = z.string().trim().min(1).max(100).transform(normalizeCollaborator);

export const projectLinkInputSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Add a label for this link.")
    .max(LIMITS.linkLabelMaxLength, `Keep link labels under ${LIMITS.linkLabelMaxLength} characters.`),
  url: httpUrl,
});
export type ProjectLinkInput = z.infer<typeof projectLinkInputSchema>;

export const projectInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(LIMITS.titleMaxLength, `Keep the title under ${LIMITS.titleMaxLength} characters.`),
  tagline: z
    .string()
    .trim()
    .max(LIMITS.taglineMaxLength, `Keep the tagline under ${LIMITS.taglineMaxLength} characters.`)
    .default(""),
  description: z
    .string()
    .max(LIMITS.descriptionMaxLength, "That description is too long.")
    .default(""),
  stack: tagListSchema.default([]),
  collaborators: z
    .array(collaboratorNameSchema)
    .max(LIMITS.maxCollaborators, `At most ${LIMITS.maxCollaborators} collaborators.`)
    .default([]),
  links: z
    .array(projectLinkInputSchema)
    .max(LIMITS.maxLinksPerProject, `At most ${LIMITS.maxLinksPerProject} links.`)
    .default([]),
});
export type ProjectInput = z.infer<typeof projectInputSchema>;

export const projectIdSchema = z.uuid("Invalid project.");
