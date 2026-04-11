'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { format, subDays, addDays, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export function OperationsDateNav({ currentDate }: { currentDate: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDate = currentDate ? new Date(currentDate) : new Date();
  const isToday = isSameDay(selectedDate, new Date());

  const navigateToDate = (date: Date) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("opsDate", format(date, "yyyy-MM-dd"));
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center gap-2 mt-0.5">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => navigateToDate(subDays(selectedDate, 1))}
        title="Jour précédent"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="text-sm text-gray-600 font-medium min-w-[120px] text-center">
        {formatDate(selectedDate)}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => navigateToDate(addDays(selectedDate, 1))}
        title="Jour suivant"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isToday && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("opsDate");
            router.push(`?${params.toString()}`, { scroll: false });
          }}
          className="ml-2 h-6 text-xs px-2"
        >
          Aujourd&apos;hui
        </Button>
      )}
    </div>
  );
}
