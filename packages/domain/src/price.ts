import { DomainError } from './error'

export interface AgreedPrice {
  id: string
  supplierId: string
  materialId: string
  unitPrice: number
}

export function assertUniqueAgreedPrice(
  existing: readonly Pick<AgreedPrice, 'id' | 'supplierId' | 'materialId'>[],
  candidate: Pick<AgreedPrice, 'id' | 'supplierId' | 'materialId'>,
): void {
  const duplicate = existing.some(
    (price) =>
      price.id !== candidate.id &&
      price.supplierId === candidate.supplierId &&
      price.materialId === candidate.materialId,
  )
  if (duplicate) {
    throw new DomainError('Agreed price already exists for this supplier and material')
  }
}
