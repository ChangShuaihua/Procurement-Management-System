import type { Category } from './category'
import type { Contract, ContractStatus, ContractType } from './contract'
import type { ContractTemplate } from './contract-template'
import type { Material, MaterialKind } from './material'
import type { EntityStatus, OrgUnit } from './org'
import type { AgreedPrice } from './price'
import type { Staff } from './staff'
import type { Supplier } from './supplier'

export interface OrgRepository {
  list(): Promise<readonly OrgUnit[]>
  findById(id: string): Promise<OrgUnit | null>
  save(unit: OrgUnit): Promise<void>
}

export interface StaffRepository {
  list(): Promise<readonly Staff[]>
  findById(id: string): Promise<Staff | null>
  findByLoginName(loginName: string): Promise<Staff | null>
  save(staff: Staff): Promise<void>
}

export interface CategoryRepository {
  list(): Promise<readonly Category[]>
  findById(id: string): Promise<Category | null>
  save(category: Category): Promise<void>
}

export interface MaterialQuery {
  categoryId?: string
  kind?: MaterialKind
  status?: EntityStatus
}

export interface MaterialRepository {
  list(query?: MaterialQuery): Promise<readonly Material[]>
  findById(id: string): Promise<Material | null>
  save(material: Material): Promise<void>
}

export interface SupplierRepository {
  list(): Promise<readonly Supplier[]>
  findById(id: string): Promise<Supplier | null>
  save(supplier: Supplier): Promise<void>
}

export interface AgreedPriceRepository {
  list(): Promise<readonly AgreedPrice[]>
  findBySupplierAndMaterial(supplierId: string, materialId: string): Promise<AgreedPrice | null>
  save(price: AgreedPrice): Promise<void>
}

export interface ContractQuery {
  type?: ContractType
  status?: ContractStatus
  partyAId?: string
  partyBId?: string
}

export interface ContractRepository {
  list(query?: ContractQuery): Promise<readonly Contract[]>
  findById(id: string): Promise<Contract | null>
  save(contract: Contract): Promise<void>
  remove(id: string): Promise<void>
}

export interface ContractTemplateRepository {
  findByType(contractType: ContractType): Promise<ContractTemplate | null>
  save(template: ContractTemplate): Promise<void>
}

export interface Repositories {
  org: OrgRepository
  staff: StaffRepository
  category: CategoryRepository
  material: MaterialRepository
  supplier: SupplierRepository
  price: AgreedPriceRepository
  contract: ContractRepository
  contractTemplate: ContractTemplateRepository
}
