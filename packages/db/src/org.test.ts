import type { OrgUnit } from '@purchase/domain'
import { DomainError } from '@purchase/domain'
import { createLogger, type LogEntry } from '@purchase/log'
import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import type { Database, OrgUnitInsert, OrgUnitRow } from './database'
import { createOrgRepository, toOrgRow, toOrgUnit } from './repositories/org'
import { DbError, throwOnError } from './result'

const company: OrgUnit = {
  id: 'org-1',
  code: 'HQ',
  name: '总部',
  parentId: null,
  type: 'company',
  address: '上海',
  canBePartyA: true,
  status: 'active',
}

const row: OrgUnitRow = {
  id: 'org-1',
  code: 'HQ',
  name: '总部',
  parent_id: null,
  type: 'company',
  address: '上海',
  can_be_party_a: true,
  status: 'active',
}

describe('org unit mapping', () => {
  it('converts a database row into a domain object and back', () => {
    expect(toOrgUnit(row)).toEqual(company)
    expect(toOrgRow(company)).toEqual(row)
  })

  it('rejects an unknown type from the database', () => {
    expect(() => toOrgUnit({ ...row, type: 'team' })).toThrow(DbError)
  })
})

describe('throwOnError', () => {
  it('throws the database message', () => {
    expect(() => throwOnError({ message: 'duplicate code' })).toThrow('duplicate code')
    expect(() => throwOnError(null)).not.toThrow()
  })
})

describe('createOrgRepository', () => {
  it('lists rows returned by the client', async () => {
    const client = fakeClient({
      list: () => Promise.resolve({ data: [row], error: null }),
    })
    const units = await createOrgRepository(client, silentLogger()).list()
    expect(units).toEqual([company])
  })

  it('returns null when the id is missing', async () => {
    const client = fakeClient({
      find: () => Promise.resolve({ data: null, error: null }),
    })
    await expect(createOrgRepository(client, silentLogger()).findById('missing')).resolves.toBeNull()
  })

  it('refuses a department marked as party A before writing', async () => {
    let wrote = false
    const client = fakeClient({
      save: () => {
        wrote = true
        return Promise.resolve({ error: null })
      },
    })
    const department: OrgUnit = { ...company, type: 'department', canBePartyA: true }
    await expect(createOrgRepository(client, silentLogger()).save(department)).rejects.toBeInstanceOf(
      DomainError,
    )
    expect(wrote).toBe(false)
  })

  it('writes a company and logs its id', async () => {
    const saved: OrgUnitInsert[] = []
    const entries: LogEntry[] = []
    const logger = createLogger({ name: 'db', sink: (entry) => entries.push(entry) })
    const client = fakeClient({
      save: (record) => {
        saved.push(record)
        return Promise.resolve({ error: null })
      },
    })

    await createOrgRepository(client, logger).save(company)

    expect(saved).toEqual([row])
    expect(entries[0]?.fields).toEqual({ id: 'org-1', code: 'HQ' })
  })
})

function silentLogger(): ReturnType<typeof createLogger> {
  return createLogger({ name: 'db', sink: () => undefined })
}

function fakeClient(handlers: {
  list?: () => Promise<{ data: OrgUnitRow[] | null; error: { message: string } | null }>
  find?: () => Promise<{ data: OrgUnitRow | null; error: { message: string } | null }>
  save?: (record: OrgUnitInsert) => Promise<{ error: { message: string } | null }>
}): SupabaseClient<Database> {
  return {
    from() {
      return {
        select() {
          return {
            order() {
              return handlers.list?.() ?? Promise.resolve({ data: [], error: null })
            },
            eq() {
              return {
                maybeSingle() {
                  return handlers.find?.() ?? Promise.resolve({ data: null, error: null })
                },
              }
            },
          }
        },
        upsert(record: OrgUnitInsert) {
          return handlers.save?.(record) ?? Promise.resolve({ error: null })
        },
      }
    },
  } as unknown as SupabaseClient<Database>
}
