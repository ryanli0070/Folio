"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TagInput } from "@/components/profile/tag-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/actions/profile";
import { LIMITS } from "@/lib/limits";
import type { PublicProfile } from "@/lib/types";
import type { ProfileFormInput } from "@/lib/validation/profile";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p className="text-sm text-destructive" role="alert">
      {messages[0]}
    </p>
  );
}

export function ProfileForm({ profile }: { profile: PublicProfile }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [values, setValues] = useState<ProfileFormInput>({
    username: profile.username,
    displayName: profile.displayName,
    bio: profile.bio,
    school: profile.school,
    githubUrl: profile.githubUrl ?? "",
    linkedinUrl: profile.linkedinUrl ?? "",
    xUrl: profile.xUrl ?? "",
    websiteUrl: profile.websiteUrl ?? "",
    email: profile.email ?? "",
    resumeUrl: profile.resumeUrl ?? "",
    skills: profile.skills,
    openToWork: profile.openToWork,
  });

  function set<K extends keyof ProfileFormInput>(key: K, value: ProfileFormInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateProfile(values);
      if (res.ok) {
        setFieldErrors({});
        toast.success("Profile saved.");
        router.refresh();
      } else {
        setFieldErrors(res.fieldErrors ?? {});
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="username">Username</Label>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">folio.app/</span>
          <Input
            id="username"
            value={values.username}
            onChange={(e) => set("username", e.target.value.toLowerCase())}
            aria-invalid={!!fieldErrors.username}
            maxLength={39}
            required
          />
        </div>
        <FieldError messages={fieldErrors.username} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          value={values.displayName}
          onChange={(e) => set("displayName", e.target.value)}
          aria-invalid={!!fieldErrors.displayName}
        />
        <FieldError messages={fieldErrors.displayName} />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="bio">Bio</Label>
          <span className="text-xs text-muted-foreground">
            {values.bio.length}/{LIMITS.bioMaxLength}
          </span>
        </div>
        <Textarea
          id="bio"
          value={values.bio}
          onChange={(e) => set("bio", e.target.value)}
          maxLength={LIMITS.bioMaxLength}
          aria-invalid={!!fieldErrors.bio}
          rows={3}
        />
        <FieldError messages={fieldErrors.bio} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="school">School</Label>
        <Input
          id="school"
          value={values.school}
          onChange={(e) => set("school", e.target.value)}
          aria-invalid={!!fieldErrors.school}
        />
        <FieldError messages={fieldErrors.school} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="githubUrl">GitHub URL</Label>
          <Input
            id="githubUrl"
            type="url"
            placeholder="https://github.com/you"
            value={values.githubUrl}
            onChange={(e) => set("githubUrl", e.target.value)}
            aria-invalid={!!fieldErrors.githubUrl}
          />
          <FieldError messages={fieldErrors.githubUrl} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
          <Input
            id="linkedinUrl"
            type="url"
            placeholder="https://linkedin.com/in/you"
            value={values.linkedinUrl}
            onChange={(e) => set("linkedinUrl", e.target.value)}
            aria-invalid={!!fieldErrors.linkedinUrl}
          />
          <FieldError messages={fieldErrors.linkedinUrl} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="xUrl">X URL</Label>
          <Input
            id="xUrl"
            type="url"
            placeholder="https://x.com/you"
            value={values.xUrl}
            onChange={(e) => set("xUrl", e.target.value)}
            aria-invalid={!!fieldErrors.xUrl}
          />
          <FieldError messages={fieldErrors.xUrl} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="websiteUrl">Website URL</Label>
          <Input
            id="websiteUrl"
            type="url"
            placeholder="https://you.dev"
            value={values.websiteUrl}
            onChange={(e) => set("websiteUrl", e.target.value)}
            aria-invalid={!!fieldErrors.websiteUrl}
          />
          <FieldError messages={fieldErrors.websiteUrl} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Contact email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            aria-invalid={!!fieldErrors.email}
          />
          <FieldError messages={fieldErrors.email} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="resumeUrl">Resume link</Label>
          <Input
            id="resumeUrl"
            type="url"
            placeholder="https://…/resume.pdf"
            value={values.resumeUrl}
            onChange={(e) => set("resumeUrl", e.target.value)}
            aria-invalid={!!fieldErrors.resumeUrl}
          />
          <FieldError messages={fieldErrors.resumeUrl} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="skills">Skills</Label>
        <TagInput
          id="skills"
          value={values.skills}
          onChange={(tags) => set("skills", tags)}
          max={LIMITS.maxTags}
          maxTagLength={LIMITS.tagMaxLength}
          aria-invalid={!!fieldErrors.skills}
        />
        <FieldError messages={fieldErrors.skills} />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <Label htmlFor="openToWork">Open to work</Label>
          <p className="text-sm text-muted-foreground">Shows a badge on your public profile.</p>
        </div>
        <Switch id="openToWork" checked={values.openToWork} onCheckedChange={(v) => set("openToWork", v)} />
      </div>

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
