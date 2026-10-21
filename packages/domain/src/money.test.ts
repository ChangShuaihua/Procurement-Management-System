import { describe, expect, it } from 'vitest'
import { DomainError, assertPositiveDecimal, calculateLineAmount, calculateTotalAmount } from './index'

describe('calculateLineAmount', () => {
  it('rounds half up to cents after multiplying', () => {
    expect(calculateLineAmount(0.012, 10000)).toBe(120)
    expect(calculateLineAmount(1.004, 1)).toBe(1)
    expect(calculateLineAmount(1.005, 1)).toBe(1.01)
    expect(calculateLineAmount(1.235, 1)).toBe(1.24)
    expect(calculateLineAmount(0.015, 1)).toBe(0.02)
  })

  it('rejects a non-positive price or quantity and more than four decimal places', () => {
    expect(() => calculateLineAmount(0, 1)).toThrow(DomainError)
    expect(() => calculateLineAmount(1, -2)).toThrow(DomainError)
    expect(() => calculateLineAmount(1.23456, 1)).toThrow('at most 4 decimal places')
    expect(() => calculateLineAmount(Number.NaN, 1)).toThrow(DomainError)
  })
})

describe('calculateTotalAmount', () => {
  it('sums already rounded line amounts', () => {
    expect(calculateTotalAmount([0.1, 0.2])).toBe(0.3)
    expect(calculateTotalAmount([120, 1.01])).toBe(121.01)
    expect(calculateTotalAmount([])).toBe(0)
  })

  it('rejects a negative amount or a third decimal', () => {
    expect(() => calculateTotalAmount([-0.01])).toThrow('must not be negative')
    expect(() => calculateTotalAmount([1.001])).toThrow('at most 2 decimal places')
  })
})

describe('assertPositiveDecimal', () => {
  it('accepts a value on the scale boundary', () => {
    expect(() => assertPositiveDecimal(0.0001, 4, 'Unit price')).not.toThrow()
  })
})
