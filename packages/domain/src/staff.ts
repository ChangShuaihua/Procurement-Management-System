import { DomainError } from './error'
import type { EntityStatus } from './org'

export interface Staff {
  id: string
  loginName: string
  name: string
  orgId: string
  phone: string | null
  status: EntityStatus
}

export function assertStaffOrgId(orgId: string): void {
  if (orgId.trim() === '') {
    throw new DomainError('Staff orgId is required')
  }
}
