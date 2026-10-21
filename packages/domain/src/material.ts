import { DomainError } from './error'
import type { EntityStatus } from './org'

export type MaterialKind = 'production' | 'operating'

export interface Material {
  id: string
  code: string
  name: string
  spec: string | null
  categoryId: string
  unit: string
  kind: MaterialKind
  status: EntityStatus
}

export function assertMaterialCategoryId(categoryId: string): void {
  if (categoryId.trim() === '') {
    throw new DomainError('Material categoryId is required')
  }
}
