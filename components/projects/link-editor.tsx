"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getLinkIcon } from "./link-icon";

export type LinkDraft = { label: string; url: string };

type LinkEditorProps = {
  value: LinkDraft[];
  onChange: (next: LinkDraft[]) => void;
  max: number;
  fieldErrors?: Record<string, string[] | undefined>;
};

/** Add/remove/reorder editor for project links, with an icon preview per row. */
export function LinkEditor({ value, onChange, max, fieldErrors }: LinkEditorProps) {
  function update(idx: number, patch: Partial<LinkDraft>) {
    onChange(value.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function move(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  function add() {
    if (value.length >= max) return;
    onChange([...value, { label: "", url: "" }]);
  }

  return (
    <div className="flex flex-col gap-3">
      {value.map((link, idx) => {
        const Icon = getLinkIcon(link.url);
        const labelError = fieldErrors?.[`links.${idx}.label`]?.[0];
        const urlError = fieldErrors?.[`links.${idx}.url`]?.[0];
        return (
          <div key={idx} className="flex flex-col gap-2 rounded-md border p-2.5 sm:flex-row sm:items-start">
            <Icon className="mt-1.5 hidden size-4 shrink-0 text-muted-foreground sm:block" aria-hidden />
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              <div>
                <Input
                  value={link.label}
                  onChange={(e) => update(idx, { label: e.target.value })}
                  placeholder="Label (e.g. Live demo)"
                  aria-invalid={!!labelError}
                  aria-label="Link label"
                />
                {labelError && <p className="mt-1 text-xs text-destructive">{labelError}</p>}
              </div>
              <div>
                <Input
                  value={link.url}
                  onChange={(e) => update(idx, { url: e.target.value })}
                  placeholder="https://..."
                  aria-invalid={!!urlError}
                  aria-label="Link URL"
                />
                {urlError && <p className="mt-1 text-xs text-destructive">{urlError}</p>}
              </div>
            </div>
            <div className="flex shrink-0 gap-1 sm:flex-col">
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="Move link up">
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => move(idx, 1)}
                disabled={idx === value.length - 1}
                aria-label="Move link down"
              >
                <ArrowDown />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(idx)} aria-label="Remove link">
                <Trash2 />
              </Button>
            </div>
          </div>
        );
      })}
      <Button type="button" variant="outline" size="sm" onClick={add} disabled={value.length >= max} className="self-start">
        <Plus /> Add link
      </Button>
    </div>
  );
}
