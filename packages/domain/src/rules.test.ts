import { describe, expect, it } from 'vitest'
import {
  DomainError,
  assertDistinctMaterials,
  assertExpiryAfterEffective,
  assertMaterialCategoryId,
  assertPartyAFlag,
  assertStaffOrgId,
  assertUniqueAgreedPrice,
} from './index'

describe('material category', () => {
  it('requires a category id', () => {
    expect(() => assertMaterialCategoryId('cat-1')).not.toThrow()
    expect(() => assertMaterialCategoryId('  ')).toThrow(DomainError)
  })
})

describe('agreed price', () => {
  const existing = [{ id: 'p1', supplierId: 's1', materialId: 'm1' }]

  it('rejects a second price for the same supplier and material', () => {
    expect(() =>
      assertUniqueAgreedPrice(existing, { id: 'p2', supplierId: 's1', materialId: 'm1' }),
    ).toThrow('already exists')
  })

  it('allows an update of the same price and a different material', () => {
    expect(() =>
      assertUniqueAgreedPrice(existing, { id: 'p1', supplierId: 's1', materialId: 'm1' }),
    ).not.toThrow()
    expect(() =>
      assertUniqueAgreedPrice(existing, { id: 'p2', supplierId: 's1', materialId: 'm2' }),
    ).not.toThrow()
  })
})

describe('organization and staff', () => {
  it('allows party A only on a company', () => {
    expect(() => assertPartyAFlag('company', true)).not.toThrow()
    expect(() => assertPartyAFlag('department', false)).not.toThrow()
    expect(() => assertPartyAFlag('department', true)).toThrow('Only a company')
  })

  it('requires a staff organization', () => {
    expect(() => assertStaffOrgId('org-1')).not.toThrow()
    expect(() => assertStaffOrgId('')).toThrow('orgId is required')
  })
})

describe('contract rules', () => {
  it('requires the expiry date to be after the effective date', () => {
    expect(() => assertExpiryAfterEffective('2026-10-21', null)).not.toThrow()
    expect(() => assertExpiryAfterEffective('2026-10-21', '2026-10-22')).not.toThrow()
    expect(() => assertExpiryAfterEffective('2026-10-21', '2026-10-21')).toThrow('after')
    expect(() => assertExpiryAfterEffective('2026/10/21', null)).toThrow('ISO date')
  })

  it('rejects a repeated material on one contract', () => {
    expect(() => assertDistinctMaterials([{ materialId: 'm1' }, { materialId: 'm2' }])).not.toThrow()
    expect(() => assertDistinctMaterials([{ materialId: 'm1' }, { materialId: 'm1' }])).toThrow(
      'only once',
    )
  })
})
