export function toNumber(decimal: { toString(): string }): number {
  return Number(decimal.toString());
}
