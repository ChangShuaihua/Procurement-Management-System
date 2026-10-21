import type { EntityStatus } from './org'

export interface Supplier {
  id: string
  code: string
  name: string
  address: string
  contactName: string
  phone: string
  status: EntityStatus
}
