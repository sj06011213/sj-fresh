/**
 * Formats a KRW amount as "₩ 12,345".
 * Space between symbol and number per project convention.
 */
export function formatKRW(amount: number): string {
  return `₩ ${amount.toLocaleString('ko-KR')}`
}
