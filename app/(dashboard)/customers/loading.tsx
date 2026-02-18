import { Skeleton } from "@/components/ui/skeleton";

export default function CustomersLoading() {
  return (
    <div className="space-y-6 bg-slate-50/70 p-1">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm"
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-8 w-16" />
            </div>
          ))}
        </div>

        <div className="mb-5 space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full flex-1 flex-col gap-3 sm:flex-row">
              <Skeleton className="h-10 w-full sm:max-w-md rounded-xl" />
              <Skeleton className="h-10 w-28 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-36 rounded-full" />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="space-y-3 p-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
