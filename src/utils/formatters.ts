export function formatCurrencyUzs(amount: number): string {
  if (!amount && amount !== 0) return '0 UZS';
  return `${Math.round(amount).toLocaleString()} UZS`;
}

export function formatCurrencyUsd(amount: number): string {
  if (!amount && amount !== 0) return '$0';
  return `$${Math.round(amount).toLocaleString()}`;
}

export function formatNumber(val: number, decimals: number = 1): string {
  if (val === undefined || val === null) return '0';
  return Number(val.toFixed(decimals)).toString();
}
