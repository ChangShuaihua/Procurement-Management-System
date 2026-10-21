import { assertPartyAFlag, type EntityStatus, type OrgRepository, type OrgUnit, type OrgUnitType } from '@purchase/domain'
import type { Logger } from '@purchase/log'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, OrgUnitInsert, OrgUnitRow } from '../database'
import { DbError, throwOnError } from '../result'

function readOrgUnitType(value: string): OrgUnitType {
  if (value === 'company' || value === 'department') {
    return value
  }
  throw new DbError(`Unexpected org unit type: ${value}`)
}

function readStatus(value: string): EntityStatus {
  if (value === 'active' || value === 'inactive') {
    return value
  }
  throw new DbError(`Unexpected org unit status: ${value}`)
}

export function toOrgUnit(row: OrgUnitRow): OrgUnit {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    parentId: row.parent_id,
    type: readOrgUnitType(row.type),
    address: row.address,
    canBePartyA: row.can_be_party_a,
    status: readStatus(row.status),
  }
}

export function toOrgRow(unit: OrgUnit): OrgUnitInsert {
  return {
    id: unit.id,
    code: unit.code,
    name: unit.name,
    parent_id: unit.parentId,
    type: unit.type,
    address: unit.address,
    can_be_party_a: unit.canBePartyA,
    status: unit.status,
  }
}

export function createOrgRepository(client: SupabaseClient<Database>, logger: Logger): OrgRepository {
  return {
    async list(): Promise<readonly OrgUnit[]> {
      const { data, error } = await client.from('org_unit').select('*').order('code')
      throwOnError(error)
      return (data ?? []).map(toOrgUnit)
    },
    async findById(id: string): Promise<OrgUnit | null> {
      const { data, error } = await client.from('org_unit').select('*').eq('id', id).maybeSingle()
      throwOnError(error)
      return data === null ? null : toOrgUnit(data)
    },
    async save(unit: OrgUnit): Promise<void> {
      assertPartyAFlag(unit.type, unit.canBePartyA)
      const { error } = await client.from('org_unit').upsert(toOrgRow(unit))
      throwOnError(error)
      logger.info('saved org unit', { id: unit.id, code: unit.code })
    },
  }
}
