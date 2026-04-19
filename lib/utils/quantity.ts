/**
 * Shared quantity parsing/formatting.
 *
 * Known units match the buttons in QuantityInput: 개 / g / kg / ml / L.
 * Free-text values like "한 팩" are not parsed here — callers treat them as opaque.
 */

export type KnownUnit = '개' | 'g' | 'kg' | 'ml' | 'L'

export function normalizeUnit(raw: string): KnownUnit | null {
  const lower = raw.toLowerCase()
  if (lower === 'kg') return 'kg'
  if (lower === 'ml') return 'ml'
  if (lower === 'g') return 'g'
  if (lower === 'l') return 'L'
  if (raw === '개') return '개'
  return null
}

export function parseQuantity(
  raw: string | null | undefined,
): { number: number; unit: KnownUnit } | null {
  if (!raw) return null
  const match = raw.trim().match(/^(\d+(?:\.\d+)?)\s*(개|kg|g|ml|L|l)$/i)
  if (!match) return null
  const number = Number.parseFloat(match[1])
  if (!Number.isFinite(number) || number < 0) return null
  const unit = normalizeUnit(match[2])
  if (!unit) return null
  return { number, unit }
}

export function formatQuantityNumber(n: number): string {
  const rounded = Math.round(n * 100) / 100
  return String(rounded)
}

export function formatQuantity(n: number, unit: KnownUnit): string {
  return `${formatQuantityNumber(n)}${unit}`
}
