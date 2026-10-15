export function toPgVector(vec: number[]): string {
  return `[${vec.join(",")}]`;
}
