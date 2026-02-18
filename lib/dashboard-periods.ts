export type DashboardPeriod = "today" | "tomorrow" | "week" | "month";

export interface PeriodBounds {
  start: Date;
  end: Date;
}

export function resolveDashboardPeriod(value?: string): DashboardPeriod {
  if (value === "tomorrow" || value === "week" || value === "month" || value === "today") {
    return value;
  }
  return "today";
}

export function getPeriodBounds(period: DashboardPeriod, now = new Date()): PeriodBounds {
  const start = new Date(now);
  const end = new Date(now);

  if (period === "today") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === "tomorrow") {
    start.setDate(start.getDate() + 1);
    end.setDate(end.getDate() + 1);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === "week") {
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  end.setMonth(end.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getPeriodLabel(period: DashboardPeriod): string {
  if (period === "today") return "Aujourd'hui";
  if (period === "tomorrow") return "Demain";
  if (period === "week") return "Cette semaine";
  return "Ce mois";
}
