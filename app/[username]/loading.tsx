import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 md:grid-cols-[280px_1fr]" aria-busy="true" aria-label="Loading">
      <div className="flex flex-col gap-3">
        <Skeleton className="size-40 rounded-full md:size-64" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="aspect-video w-full" />
        ))}
      </div>
    </div>
  );
}
