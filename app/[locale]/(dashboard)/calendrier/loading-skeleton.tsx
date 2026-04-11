import { Skeleton } from "@/components/ui/skeleton";

export function CalendarSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-80" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>

        {/* Navigation bar skeleton */}
        <div className="bg-card rounded-lg border border-border p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-9 w-9" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-36" />
          </div>
        </div>

        {/* Legend skeleton */}
        <div className="flex items-center gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-card rounded-lg border border-border p-3 text-center space-y-2"
          >
            <Skeleton className="h-6 w-12 mx-auto" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        {/* Header row */}
        <div className="grid border-b border-border" style={{ gridTemplateColumns: "200px repeat(7, 1fr)" }}>
          <div className="p-3 border-r border-border bg-muted/50">
            <Skeleton className="h-4 w-16" />
          </div>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="p-3 text-center border-r border-border last:border-r-0 bg-muted/30">
              <Skeleton className="h-3 w-8 mx-auto" />
              <Skeleton className="h-4 w-5 mx-auto mt-1" />
            </div>
          ))}
        </div>

        {/* Vehicle rows */}
        {[1, 2, 3, 4, 5].map((row) => (
          <div
            key={row}
            className="grid border-b border-border last:border-b-0"
            style={{ gridTemplateColumns: "200px repeat(7, 1fr)", minHeight: "80px" }}
          >
            {/* Vehicle sidebar skeleton */}
            <div className="flex items-center gap-3 p-3 border-r border-border">
              <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>

            {/* Day cells */}
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div
                key={day}
                className="border-r border-border last:border-r-0 min-h-[80px] p-1"
              >
                {/* Random booking skeletons */}
                {row % 2 === 0 && day >= 2 && day <= 5 && (
                  <Skeleton className="h-[70px] w-full rounded-md" />
                )}
                {row % 3 === 0 && day >= 5 && day <= 7 && (
                  <Skeleton className="h-[70px] w-full rounded-md" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
