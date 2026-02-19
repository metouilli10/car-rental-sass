export function formatMAD(amount: number): string {
  return (
    new Intl.NumberFormat("fr-MA", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace(/\s/g, " ") + " MAD"
  );
}
