import { z } from "zod";
import { LIMITS } from "@/lib/limits";
import { optionalHttpUrl, tagListSchema, usernameSchema } from "@/lib/validation/common";

/** Empty string -> null; otherwise must be a valid email. */
const optionalEmail = z
  .union([z.literal(""), z.email("Enter a valid email.")])
  .transform((v) => (v === "" ? null : v));

export const profileFormSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().max(LIMITS.displayNameMaxLength),
  bio: z.string().trim().max(LIMITS.bioMaxLength, `Bio must be ${LIMITS.bioMaxLength} characters or fewer.`),
  school: z.string().trim().max(LIMITS.schoolMaxLength),
  githubUrl: optionalHttpUrl,
  linkedinUrl: optionalHttpUrl,
  xUrl: optionalHttpUrl,
  websiteUrl: optionalHttpUrl,
  email: optionalEmail,
  resumeUrl: optionalHttpUrl,
  skills: tagListSchema,
  openToWork: z.boolean(),
});

/** Shape of the client-side form state, before zod transforms (e.g. "" instead of null). */
export type ProfileFormInput = z.input<typeof profileFormSchema>;
export type ProfileFormValues = z.output<typeof profileFormSchema>;
