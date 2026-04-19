/**
 * Parses free-text from voice input into { name, quantity }.
 *
 * Recognizes patterns at the end of the string:
 * - number + unit:  "라면 2kg"  →  { name: "라면", quantity: "2kg" }
 * - korean number + unit:  "계란 한 판"  →  { name: "계란", quantity: "한 판" }
 * - lone korean number: "우유 하나"  →  { name: "우유", quantity: "하나" }
 *
 * If no pattern matches, the whole text becomes the name.
 */

const UNIT_PATTERN =
  '개|팩|봉지|봉|병|캔|상자|박스|묶음|줄|판|통|근|장|쪽|조각|알|포기|단|마리|kg|g|ml|L|리터|킬로|그램'
const KOR_NUMBER_PATTERN = '한|두|세|네|다섯|여섯|일곱|여덟|아홉|열'

const QUANTITY_REGEX = new RegExp(
  `\\s+((?:(?:${KOR_NUMBER_PATTERN})\\s*(?:${UNIT_PATTERN}))|(?:\\d+(?:\\.\\d+)?\\s*(?:${UNIT_PATTERN})?))$`,
)
const LONE_KOR_NUMBER_REGEX = new RegExp(
  `\\s+(${KOR_NUMBER_PATTERN}|하나|둘|셋|넷)$`,
)

export function parseShoppingText(raw: string): {
  name: string
  quantity: string
} {
  const text = raw.trim().replace(/[.,!?]+$/u, '')
  const m = text.match(QUANTITY_REGEX)
  if (m && m.index !== undefined) {
    return { name: text.slice(0, m.index).trim(), quantity: m[1].trim() }
  }
  const m2 = text.match(LONE_KOR_NUMBER_REGEX)
  if (m2 && m2.index !== undefined) {
    return { name: text.slice(0, m2.index).trim(), quantity: m2[1].trim() }
  }
  return { name: text, quantity: '' }
}
