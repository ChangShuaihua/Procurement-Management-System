import type { EntityStatus } from './org'

export interface Category {
  id: string
  code: string
  name: string
  parentId: string | null
  status: EntityStatus
}
