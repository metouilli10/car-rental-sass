export type DashboardPeriod = "today" | "tomorrow" | "week" | "month";
export type DashboardV3Period = "today" | "7d" | "month" | "custom";

export interface DateRange {
  start: Date;
  end: Date;
}

function atStartOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function atEndOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function addDays(value: Date, days: number): Date {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

export function resolveDashboardPeriod(raw?: string): DashboardPeriod {
  if (
    raw === "today" ||
    raw === "tomorrow" ||
    raw === "week" ||
    raw === "month"
  ) {
    return raw;
  }
  return "today";
}

export function isDashboardPeriod(raw?: string): raw is DashboardPeriod {
  return raw === "today" || raw === "tomorrow" || raw === "week" || raw === "month";
}

export function getPeriodRange(period: DashboardPeriod, now = new Date()): DateRange {
  if (period === "today") {
    return { start: atStartOfDay(now), end: atEndOfDay(now) };
  }

  if (period === "tomorrow") {
    const tomorrow = addDays(now, 1);
    return { start: atStartOfDay(tomorrow), end: atEndOfDay(tomorrow) };
  }

  if (period === "week") {
    return {
      start: atStartOfDay(now),
      end: atEndOfDay(addDays(now, 6)),
    };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = atEndOfDay(now);
  return { start, end };
}

export function getComparableRange(
  period: DashboardPeriod,
  currentRange: DateRange,
  now = new Date()
): DateRange {
  if (period === "today") {
    const yesterday = addDays(now, -1);
    return { start: atStartOfDay(yesterday), end: atEndOfDay(yesterday) };
  }

  if (period === "month") {
    const elapsedMs = currentRange.end.getTime() - currentRange.start.getTime();
    const previousMonthStart = new Date(
      currentRange.start.getFullYear(),
      currentRange.start.getMonth() - 1,
      1,
      0,
      0,
      0,
      0
    );
    return {
      start: previousMonthStart,
      end: new Date(previousMonthStart.getTime() + elapsedMs),
    };
  }

  const durationMs = currentRange.end.getTime() - currentRange.start.getTime();
  const previousEnd = new Date(currentRange.start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - durationMs);
  return { start: previousStart, end: previousEnd };
}

export function periodLabel(period: DashboardPeriod): string {
  if (period === "today") return "Aujourd'hui";
  if (period === "tomorrow") return "Demain";
  if (period === "week") return "Cette semaine";
  return "Ce mois";
}

export const getPeriodLabel = periodLabel;

export interface DashboardV3PeriodInput {
  period?: string;
  start?: string;
  end?: string;
}

export interface DashboardV3ResolvedPeriod {
  key: DashboardV3Period;
  label: string;
  range: DateRange;
}

function parseDateValue(raw?: string): Date | null {
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function resolveDashboardV3Period(
  input: DashboardV3PeriodInput,
  now = new Date()
): DashboardV3ResolvedPeriod {
  if (input.period === "custom") {
    const startDate = parseDateValue(input.start);
    const endDate = parseDateValue(input.end);
    if (startDate && endDate && startDate.getTime() <= endDate.getTime()) {
      return {
        key: "custom",
        label: "Personnalisee",
        range: {
          start: atStartOfDay(startDate),
          end: atEndOfDay(endDate),
        },
      };
    }
  }

  if (input.period === "month") {
    return {
      key: "month",
      label: "Ce mois",
      range: {
        start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
        end: atEndOfDay(now),
      },
    };
  }

  if (input.period === "7d" || input.period === "week") {
    return {
      key: "7d",
      label: "7 jours",
      range: {
        start: atStartOfDay(now),
        end: atEndOfDay(addDays(now, 6)),
      },
    };
  }

  return {
    key: "today",
    label: "Aujourd'hui",
    range: {
      start: atStartOfDay(now),
      end: atEndOfDay(now),
    },
  };
}
