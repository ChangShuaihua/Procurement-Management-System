import { DomainError } from './error'

const INPUT_SCALE = 4
const AMOUNT_SCALE = 2

function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new DomainError(`${label} must be a finite number`)
  }
}

function scaledDigits(value: number, scale: number): bigint {
  const text = value.toFixed(scale)
  const negative = text.startsWith('-')
  const digits = text.replace('-', '').replace('.', '')
  const amount = BigInt(digits)
  return negative ? -amount : amount
}

function exceedsScale(value: number, scale: number): boolean {
  const restored = Number(scaledDigits(value, scale)) / 10 ** scale
  return Math.abs(restored - value) > 1e-9
}

export function assertPositiveDecimal(value: number, scale: number, label: string): void {
  assertFinite(value, label)
  if (value <= 0) {
    throw new DomainError(`${label} must be greater than 0`)
  }
  if (exceedsScale(value, scale)) {
    throw new DomainError(`${label} must have at most ${scale} decimal places`)
  }
}

function roundHalfUp(value: bigint, fromScale: number, toScale: number): bigint {
  const drop = fromScale - toScale
  const factor = 10n ** BigInt(drop)
  const quotient = value / factor
  const remainder = value % factor
  return remainder * 2n >= factor ? quotient + 1n : quotient
}

export function calculateLineAmount(unitPrice: number, quantity: number): number {
  assertPositiveDecimal(unitPrice, INPUT_SCALE, 'Unit price')
  assertPositiveDecimal(quantity, INPUT_SCALE, 'Quantity')
  const product = scaledDigits(unitPrice, INPUT_SCALE) * scaledDigits(quantity, INPUT_SCALE)
  const cents = roundHalfUp(product, INPUT_SCALE * 2, AMOUNT_SCALE)
  return Number(cents) / 100
}

export function calculateTotalAmount(lineAmounts: readonly number[]): number {
  let cents = 0n
  for (const amount of lineAmounts) {
    assertFinite(amount, 'Line amount')
    if (amount < 0) {
      throw new DomainError('Line amount must not be negative')
    }
    if (exceedsScale(amount, AMOUNT_SCALE)) {
      throw new DomainError('Line amount must have at most 2 decimal places')
    }
    cents += scaledDigits(amount, AMOUNT_SCALE)
  }
  return Number(cents) / 100
}
