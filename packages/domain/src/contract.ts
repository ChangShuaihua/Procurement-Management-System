import { DomainError } from './error'

export type ContractType = 'nda' | 'purchase'

export type ContractStatus = 'draft' | 'effective'

export interface ContractLine {
  materialId: string
  name: string
  spec: string | null
  unit: string
  unitPrice: number
  quantity: number
  amount: number
}

export interface Contract {
  id: string
  number: string
  type: ContractType
  title: string
  partyAId: string
  partyBId: string
  handlerName: string
  signedOn: string | null
  effectiveOn: string | null
  expiresOn: string | null
  status: ContractStatus
  remark: string | null
  body: string
  partyAName: string
  partyAAddress: string
  partyBName: string
  partyBAddress: string
  partyBContactName: string
  partyBPhone: string
  lines: ContractLine[]
  templateHtml: string | null
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function assertIsoDate(value: string, label: string): void {
  if (!ISO_DATE.test(value)) {
    throw new DomainError(`${label} must be an ISO date`)
  }
}

export function assertExpiryAfterEffective(effectiveOn: string, expiresOn: string | null): void {
  assertIsoDate(effectiveOn, 'Effective date')
  if (expiresOn === null) {
    return
  }
  assertIsoDate(expiresOn, 'Expiry date')
  if (expiresOn <= effectiveOn) {
    throw new DomainError('Expiry date must be after the effective date')
  }
}

export function assertDistinctMaterials(lines: readonly Pick<ContractLine, 'materialId'>[]): void {
  const seen = new Set<string>()
  for (const line of lines) {
    if (seen.has(line.materialId)) {
      throw new DomainError('A material can appear only once on a purchase contract')
    }
    seen.add(line.materialId)
  }
}
