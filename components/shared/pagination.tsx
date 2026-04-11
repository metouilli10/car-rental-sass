"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-context";
import { useLocalizedPath } from "@/components/i18n/use-localized-path";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  /** Existing search params to preserve (e.g. status filter) */
  searchParams?: Record<string, string | undefined>;
}

export function Pagination({ currentPage, totalPages, baseUrl, searchParams = {} }: PaginationProps) {
  const { t } = useI18n();
  const lp = useLocalizedPath();
  if (totalPages <= 1) return null;

  const pathBase = baseUrl.startsWith("/") ? baseUrl : `/${baseUrl}`;
  const localizedBase = lp(pathBase);

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    params.set("page", String(page));
    return `${localizedBase}?${params.toString()}`;
  };

  // Show at most 5 page numbers centered around current page
  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="text-sm text-muted-foreground">
        {t("pagination.pageOf", { current: currentPage, total: totalPages })}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          asChild
          disabled={currentPage <= 1}
        >
          <Link href={currentPage > 1 ? buildHref(currentPage - 1) : "#"} aria-disabled={currentPage <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>

        {pages[0] > 1 && (
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={buildHref(1)}>1</Link>
            </Button>
            {pages[0] > 2 && <span className="px-1 text-muted-foreground">…</span>}
          </>
        )}

        {pages.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={buildHref(page)}>{page}</Link>
          </Button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="px-1 text-muted-foreground">…</span>}
            <Button variant="outline" size="sm" asChild>
              <Link href={buildHref(totalPages)}>{totalPages}</Link>
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          asChild
          disabled={currentPage >= totalPages}
        >
          <Link href={currentPage < totalPages ? buildHref(currentPage + 1) : "#"} aria-disabled={currentPage >= totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
