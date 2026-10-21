import { DomainError } from './error'

export type OrgUnitType = 'company' | 'department'

export type EntityStatus = 'active' | 'inactive'

export interface OrgUnit {
  id: string
  code: string
  name: string
  parentId: string | null
  type: OrgUnitType
  address: string | null
  canBePartyA: boolean
  status: EntityStatus
}

export function assertPartyAFlag(type: OrgUnitType, canBePartyA: boolean): void {
  if (canBePartyA && type !== 'company') {
    throw new DomainError('Only a company can be party A')
  }
}
