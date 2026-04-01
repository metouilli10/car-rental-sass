import { Card, CardContent } from "@/components/ui/card";

export default function InfractionDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-24 animate-pulse rounded bg-muted" />
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-44 animate-pulse rounded-lg bg-muted" />
          <div className="mt-2 h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="mb-3 h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
