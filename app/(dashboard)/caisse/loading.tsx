import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function CaisseLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="h-9 w-48 animate-pulse rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
          <div className="h-9 w-16 animate-pulse rounded-lg bg-muted" />
          <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="rounded-xl">
            <CardHeader className="pb-2">
              <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg border bg-muted/30" />
      </div>
    </div>
  );
}
