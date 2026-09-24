/**
 * Server-safe markdown renderer: react-markdown + remark-gfm + rehype-sanitize (default schema).
 * No rehype-raw, no dangerouslySetInnerHTML. Styled README-like via component overrides.
 */
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { cn } from "@/lib/utils";

const components: Components = {
  a: ({ node: _node, className, ...props }) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("text-link underline-offset-2 hover:underline", className)}
    />
  ),
  h1: ({ node: _node, className, ...props }) => (
    <h1 {...props} className={cn("mt-6 mb-4 border-b pb-2 text-2xl font-semibold first:mt-0", className)} />
  ),
  h2: ({ node: _node, className, ...props }) => (
    <h2 {...props} className={cn("mt-6 mb-3 border-b pb-2 text-xl font-semibold first:mt-0", className)} />
  ),
  h3: ({ node: _node, className, ...props }) => (
    <h3 {...props} className={cn("mt-5 mb-2 text-lg font-semibold first:mt-0", className)} />
  ),
  h4: ({ node: _node, className, ...props }) => (
    <h4 {...props} className={cn("mt-4 mb-2 text-base font-semibold first:mt-0", className)} />
  ),
  p: ({ node: _node, className, ...props }) => <p {...props} className={cn("mb-4 leading-relaxed last:mb-0", className)} />,
  ul: ({ node: _node, className, ...props }) => (
    <ul {...props} className={cn("mb-4 list-disc space-y-1 pl-6 last:mb-0", className)} />
  ),
  ol: ({ node: _node, className, ...props }) => (
    <ol {...props} className={cn("mb-4 list-decimal space-y-1 pl-6 last:mb-0", className)} />
  ),
  li: ({ node: _node, className, ...props }) => <li {...props} className={cn("leading-relaxed", className)} />,
  blockquote: ({ node: _node, className, ...props }) => (
    <blockquote {...props} className={cn("mb-4 border-l-4 pl-4 text-muted-foreground last:mb-0", className)} />
  ),
  hr: ({ node: _node, className, ...props }) => <hr {...props} className={cn("my-6 border-border", className)} />,
  img: ({ node: _node, className, alt, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element -- markdown images come from arbitrary remote hosts
    <img {...props} alt={alt ?? ""} className={cn("my-4 max-w-full rounded-md border", className)} />
  ),
  table: ({ node: _node, className, ...props }) => (
    <div className="mb-4 overflow-x-auto last:mb-0">
      <table {...props} className={cn("w-full border-collapse text-sm", className)} />
    </div>
  ),
  thead: ({ node: _node, className, ...props }) => <thead {...props} className={cn("bg-canvas-subtle", className)} />,
  th: ({ node: _node, className, ...props }) => (
    <th {...props} className={cn("border px-3 py-1.5 text-left font-semibold", className)} />
  ),
  td: ({ node: _node, className, ...props }) => <td {...props} className={cn("border px-3 py-1.5", className)} />,
  pre: ({ node: _node, className, ...props }) => (
    <pre {...props} className={cn("mb-4 overflow-x-auto rounded-md bg-canvas-subtle p-3 text-sm last:mb-0", className)} />
  ),
  code: ({ node: _node, className, ...props }) => {
    const isBlock = /language-/.test(className ?? "");
    if (isBlock) return <code {...props} className={cn("font-mono text-sm", className)} />;
    return <code {...props} className={cn("rounded bg-canvas-subtle px-1 py-0.5 font-mono text-[0.85em] break-all", className)} />;
  },
  strong: ({ node: _node, className, ...props }) => <strong {...props} className={cn("font-semibold", className)} />,
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="max-w-none min-w-0 text-sm text-foreground [overflow-wrap:anywhere]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
