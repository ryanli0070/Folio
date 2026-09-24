"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type TagInputProps = {
  value: string[];
  onChange: (next: string[]) => void;
  max: number;
  placeholder?: string;
  "aria-label"?: string;
};

/** Chip-style input for stack tags and collaborator names. Enter/comma commits a chip. */
export function TagInput({ value, onChange, max, placeholder, ...rest }: TagInputProps) {
  const [draft, setDraft] = useState("");
  const atMax = value.length >= max;

  function commit() {
    const trimmed = draft.trim();
    setDraft("");
    if (!trimmed || atMax) return;
    if (value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...value, trimmed]);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-input px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1">
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((v) => v !== tag))}
            aria-label={`Remove ${tag}`}
            className="rounded-full hover:text-destructive"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      {!atMax && (
        <input
          {...rest}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder={value.length === 0 ? placeholder : undefined}
          className="min-w-24 flex-1 border-0 bg-transparent p-0.5 text-sm outline-none placeholder:text-muted-foreground"
        />
      )}
    </div>
  );
}
