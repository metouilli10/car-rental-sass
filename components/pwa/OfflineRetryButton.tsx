"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OfflineRetryButton() {
  return (
    <Button type="button" onClick={() => window.location.reload()} className="rounded-xl">
      <RotateCw className="h-4 w-4" />
      Réessayer
    </Button>
  );
}
