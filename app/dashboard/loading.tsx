import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-48" />
      <div className="flex flex-col divide-y rounded-md border">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="size-14" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
