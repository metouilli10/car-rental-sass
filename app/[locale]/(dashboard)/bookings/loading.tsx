import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <Skeleton className="h-10 w-48" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-3 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-12" />
            </div>
          </Card>
        ))}
      </div>

      {/* Filters Toolbar Skeleton */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <Skeleton className="h-10 w-full lg:max-w-md" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-8 w-24" />
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-8 w-36" />
        </div>
      </Card>

      {/* Bookings Table Skeleton */}
      <Card>
        <div className="p-6">
          {/* Table Header */}
          <div className="grid grid-cols-7 gap-4 pb-4 border-b">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>

          {/* Table Rows */}
          <div className="space-y-4 mt-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="grid grid-cols-7 gap-4 items-center py-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-9 w-10" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
