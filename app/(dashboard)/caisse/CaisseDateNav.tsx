"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format, subDays, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type CaisseDateNavProps = {
  viewMode: "day" | "month";
  selectedDate: Date;
  selectedMonth: Date | null;
  today: Date;
};

function toMonthParam(d: Date) {
  return format(d, "yyyy-MM");
}

export function CaisseDateNav({
  viewMode,
  selectedDate,
  selectedMonth,
  today,
}: CaisseDateNavProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const yesterday = subDays(today, 1);
  const dayBefore = subDays(today, 2);

  const toDateParam = (d: Date) => format(d, "yyyy-MM-dd");
  const hrefToday = "/caisse";
  const hrefYesterday = `/caisse?date=${toDateParam(yesterday)}`;
  const hrefDayBefore = `/caisse?date=${toDateParam(dayBefore)}`;
  const hrefThisMonth = `/caisse?month=${toMonthParam(today)}`;

  const isToday =
    viewMode === "day" &&
    format(selectedDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
  const isYesterday =
    viewMode === "day" &&
    format(selectedDate, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd");
  const isDayBefore =
    viewMode === "day" &&
    format(selectedDate, "yyyy-MM-dd") === format(dayBefore, "yyyy-MM-dd");
  const isThisMonth =
    viewMode === "month" &&
    selectedMonth &&
    toMonthParam(selectedMonth) === toMonthParam(today);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("month");
    if (format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) {
      params.delete("date");
      router.push(params.toString() ? `/caisse?${params}` : "/caisse");
    } else {
      params.set("date", toDateParam(date));
      router.push(`/caisse?${params}`);
    }
  };

  const goPrevMonth = () => {
    if (!selectedMonth) return;
    const prev = subMonths(selectedMonth, 1);
    router.push(`/caisse?month=${toMonthParam(prev)}`);
  };
  const goNextMonth = () => {
    if (!selectedMonth) return;
    const next = addMonths(selectedMonth, 1);
    if (next > today) return; // don't go past current month
    router.push(`/caisse?month=${toMonthParam(next)}`);
  };
  const canGoNextMonth =
    selectedMonth && addMonths(selectedMonth, 1) <= today;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm text-muted-foreground">Voir :</span>
      <div className="flex flex-wrap items-center gap-1">
        <Button
          variant={isToday ? "secondary" : "outline"}
          size="sm"
          className="rounded-lg"
          asChild
        >
          <Link href={hrefToday}>Aujourd&apos;hui</Link>
        </Button>
        <Button
          variant={isYesterday ? "secondary" : "outline"}
          size="sm"
          className="rounded-lg"
          asChild
        >
          <Link href={hrefYesterday}>Hier</Link>
        </Button>
        <Button
          variant={isDayBefore ? "secondary" : "outline"}
          size="sm"
          className="rounded-lg"
          asChild
        >
          <Link href={hrefDayBefore}>Avant-hier</Link>
        </Button>
        <Button
          variant={isThisMonth ? "secondary" : "outline"}
          size="sm"
          className="rounded-lg"
          asChild
        >
          <Link href={hrefThisMonth}>Ce mois</Link>
        </Button>
      </div>
      {viewMode === "month" && selectedMonth ? (
        <div className="flex items-center gap-1 rounded-lg border bg-muted/30 px-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goPrevMonth}
            title="Mois précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center text-sm font-medium capitalize">
            {format(selectedMonth, "MMMM yyyy", { locale: fr })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goNextMonth}
            disabled={!canGoNextMonth}
            title="Mois suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "rounded-lg gap-2 min-w-[140px] justify-start text-left font-normal"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              {format(selectedDate, "d MMM yyyy", { locale: fr })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              locale={fr}
              disabled={(date) => date > today}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
