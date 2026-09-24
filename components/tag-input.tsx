"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type TagInputProps = {
  id?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  max: number;
  /** Longer entries are truncated; omit for no truncation. */
  maxTagLength?: number;
  placeholder?: string;
  "aria-invalid"?: boolean;
  "aria-label"?: string;
};

/** Chip input: type + Enter or comma to add a tag, click x (or Backspace on empty) to remove one. */
export function TagInput({
  id,
  value,
  onChange,
  max,
  maxTagLength,
  placeholder = "Type and press Enter",
  ...rest
}: TagInputProps) {
  const [draft, setDraft] = useState("");
  const atMax = value.length >= max;

  function addTag(raw: string) {
    const tag = raw.trim().slice(0, maxTagLength ?? Infinity);
    if (!tag || atMax) {
      setDraft("");
      return;
    }
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2.5 py-1.5 has-focus:border-ring has-focus:ring-3 has-focus:ring-ring/50 aria-invalid:border-destructive"
      aria-invalid={rest["aria-invalid"]}
    >
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1 py-0.5 pr-1 font-normal">
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            aria-label={`Remove ${tag}`}
            className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      {!atMax && (
        <input
          id={id}
          aria-label={rest["aria-label"]}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(draft)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-24 flex-1 border-0 bg-transparent py-0.5 text-base outline-none placeholder:text-muted-foreground md:text-sm"
        />
      )}
    </div>
  );
}
