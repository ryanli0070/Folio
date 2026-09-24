"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { removeAvatar } from "@/lib/actions/profile";
import { IMAGE_TYPES, LIMITS } from "@/lib/limits";
import { uploadFile } from "@/lib/storage/client";

export type AvatarEditorProps = {
  username: string;
  avatarUrl: string | null;
  githubAvatarUrl: string | null;
  hasCustomAvatar: boolean;
};

const MAX_MB = Math.round(LIMITS.avatarMaxBytes / (1024 * 1024));

export function AvatarEditor({ username, avatarUrl, githubAvatarUrl, hasCustomAvatar }: AvatarEditorProps) {
  const [preview, setPreview] = useState(avatarUrl);
  const [hasCustom, setHasCustom] = useState(hasCustomAvatar);
  const [uploading, setUploading] = useState(false);
  const [isRemoving, startRemoveTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
      toast.error("Choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > LIMITS.avatarMaxBytes) {
      toast.error(`Image must be under ${MAX_MB} MB.`);
      return;
    }

    setUploading(true);
    try {
      const result = await uploadFile(file, { purpose: "avatar" });
      setPreview(result.avatarUrl);
      setHasCustom(true);
      toast.success("Avatar updated.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    startRemoveTransition(async () => {
      const res = await removeAvatar();
      if (res.ok) {
        setPreview(githubAvatarUrl);
        setHasCustom(false);
        toast.success("Avatar removed.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16">
        {preview && <AvatarImage src={preview} alt="" />}
        <AvatarFallback className="text-lg">{username.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? "Uploading…" : "Upload new"}
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={!hasCustom || isRemoving} onClick={handleRemove}>
            {isRemoving ? "Removing…" : "Remove"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, or GIF. Up to {MAX_MB} MB.</p>
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          className="hidden"
          onChange={handleFileChange}
          aria-label="Upload avatar"
        />
      </div>
    </div>
  );
}
