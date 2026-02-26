import { Card, CardContent } from "@/components/ui/card";

export default function InfractionsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
          <div className="mt-2 h-4 w-24 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-10 w-44 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Filter tabs skeleton */}
      <div className="flex gap-2 rounded-xl bg-muted/50 p-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-24 animate-pulse rounded-full bg-muted"
          />
        ))}
      </div>

      {/* Table skeleton */}
      <Card>
        <CardContent className="p-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b p-4 last:border-b-0"
            >
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
              <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
