export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return "0";
  if (num >= 1_000_000) {
    const tr = num / 1_000_000;
    const formatted = tr >= 10 ? Math.round(tr).toString() : Number.isInteger(tr) ? tr.toString() : tr.toFixed(1).replace(".", ",");
    return `${formatted} Tr`;
  }
  if (num >= 1_000) {
    const k = num / 1_000;
    const formatted = k >= 10 ? Math.round(k).toString() : Number.isInteger(k) ? k.toString() : k.toFixed(1).replace(".", ",");
    return `${formatted}k`;
  }
  return num.toLocaleString();
}
