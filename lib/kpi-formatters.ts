const integerFormatter = new Intl.NumberFormat("fr-MA", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatKpiInteger(value: number): string {
  return integerFormatter.format(value).replace(/\s/g, " ");
}

export function formatMadKpi(value: number): string {
  return `${formatKpiInteger(value)} MAD`;
}

export function formatKpiRatio(current: number, total: number): string {
  return `${formatKpiInteger(current)} / ${formatKpiInteger(total)}`;
}
