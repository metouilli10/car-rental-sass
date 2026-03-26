"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ActionCenterSheetTone = "neutral" | "green" | "amber" | "red";

interface ActionCenterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  summaryRows: Array<{ label: string; value: string | number }>;
  children: ReactNode;
  tone?: ActionCenterSheetTone;
}

const TONE_STYLES: Record<
  ActionCenterSheetTone,
  {
    header: string;
    title: string;
    description: string;
    summary: string;
    summaryLabel: string;
    summaryValue: string;
  }
> = {
  neutral: {
    header: "border-border",
    title: "text-foreground",
    description: "text-muted-foreground",
    summary: "border-border bg-muted/20",
    summaryLabel: "text-muted-foreground",
    summaryValue: "text-foreground",
  },
  green: {
    header: "border-orange-200/80",
    title: "text-orange-700",
    description: "text-orange-700/80",
    summary: "border-orange-200/80 bg-orange-50/70",
    summaryLabel: "text-orange-700/80",
    summaryValue: "text-orange-800",
  },
  amber: {
    header: "border-sky-200/80",
    title: "text-foreground",
    description: "text-foreground",
    summary: "border-sky-200/80 bg-sky-50/70",
    summaryLabel: "text-foreground",
    summaryValue: "text-foreground",
  },
  red: {
    header: "border-red-200/80",
    title: "text-red-700",
    description: "text-red-700/80",
    summary: "border-red-200/80 bg-red-50/70",
    summaryLabel: "text-red-700/80",
    summaryValue: "text-red-800",
  },
};

export function useDashboardSheetSide() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 640px)");
    const handleChange = (event: MediaQueryList | MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    handleChange(media);
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handleChange);
      return () => media.removeEventListener("change", handleChange);
    }

    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  return isDesktop ? "right" : "bottom";
}

export function ActionCenterSheet({
  open,
  onOpenChange,
  title,
  description,
  summaryRows,
  children,
  tone = "neutral",
}: ActionCenterSheetProps) {
  const side = useDashboardSheetSide();
  const toneStyles = TONE_STYLES[tone];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={
          side === "right"
            ? "w-full sm:max-w-xl"
            : "max-h-[88vh] rounded-t-3xl px-4 pb-6 pt-8"
        }
      >
        <SheetHeader className={cn("space-y-1 border-b pb-4 text-left", toneStyles.header)}>
          <SheetTitle className={toneStyles.title}>{title}</SheetTitle>
          <SheetDescription className={toneStyles.description}>{description}</SheetDescription>
        </SheetHeader>

        <div className={cn("mt-4 rounded-lg border px-3 py-3", toneStyles.summary)}>
          {summaryRows.map((row, index) => (
            <div
              key={row.label}
              className={index === 0 ? "flex items-center justify-between gap-3 text-sm" : "mt-2 flex items-center justify-between gap-3 text-sm"}
            >
              <span className={toneStyles.summaryLabel}>{row.label}</span>
              <span className={cn("font-medium", toneStyles.summaryValue)}>{row.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-3 overflow-y-auto pb-2">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

export function ActionCenterSheetLoading() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border p-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-3 w-40" />
          <Skeleton className="mt-4 h-9 w-full" />
        </div>
      ))}
    </>
  );
}

export function ActionCenterSheetError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  );
}

export function ActionCenterSheetEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-4 py-6 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
        <ShieldCheck className="h-5 w-5 text-emerald-700" />
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
