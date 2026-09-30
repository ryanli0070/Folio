"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Stack chips that show the first `preview` and expand to the rest via a "+N" toggle. */
export function StackChips({ stack, preview }: { stack: string[]; preview: number }) {
  const [expanded, setExpanded] = useState(false);
  const hidden = stack.length - preview;
  const shown = expanded || hidden <= 0 ? stack : stack.slice(0, preview);

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      {shown.map((tech) => (
        <Badge key={tech} variant="outline" className="font-normal text-muted-foreground">
          {tech}
        </Badge>
      ))}
      {hidden > 0 && (
        // Sits above the card's stretched link so it toggles instead of navigating.
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-label={expanded ? "Show fewer technologies" : `Show ${hidden} more technologies`}
          className="relative z-10 inline-flex h-5 items-center gap-0.5 rounded-full border px-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {expanded ? "Less" : `+${hidden}`}
          <ChevronDown className={cn("size-3 transition-transform", expanded && "rotate-180")} aria-hidden />
        </button>
      )}
    </div>
  );
}
