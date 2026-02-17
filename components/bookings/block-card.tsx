"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BlockCardProps {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function BlockCard({ id, title, description, children, className }: BlockCardProps) {
  return (
    <Card id={id} className={cn("rounded-2xl border-border/70 shadow-sm", className)}>
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}
