import { Card, CardContent } from "@/components/ui/card";

export default function NewInfractionLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-52 animate-pulse rounded-lg bg-muted" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="space-y-5 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-12">
              <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
              <div className="mt-3 h-4 w-48 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
