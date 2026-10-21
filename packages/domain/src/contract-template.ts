import type { ContractType } from './contract'

export interface ContractTemplate {
  contractType: ContractType
  html: string
  updatedAt: string
}
