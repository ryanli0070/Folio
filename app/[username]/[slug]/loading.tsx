import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-8" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="aspect-video w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
