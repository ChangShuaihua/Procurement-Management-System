import { describe, expect, it, vi } from 'vitest'
import { createConsoleLogger, createLogger, type LogEntry } from './index'

const now = () => new Date('2026-10-21T14:00:00.000Z')

function capture(): { entries: LogEntry[]; sink: (entry: LogEntry) => void } {
  const entries: LogEntry[] = []
  return { entries, sink: (entry) => entries.push(entry) }
}

describe('createLogger', () => {
  it('writes the level, name, time, message, and fields', () => {
    const { entries, sink } = capture()
    const logger = createLogger({ name: 'db', sink, now })

    logger.info('price saved', { supplierId: 's1' })

    expect(entries).toEqual([
      {
        time: '2026-10-21T14:00:00.000Z',
        level: 'info',
        name: 'db',
        message: 'price saved',
        fields: { supplierId: 's1' },
      },
    ])
  })

  it('supports every level and omits fields when none are given', () => {
    const { entries, sink } = capture()
    const logger = createLogger({ name: 'server', sink, now })

    logger.debug('a')
    logger.info('b')
    logger.warn('c')
    logger.error('d')

    expect(entries.map((entry) => entry.level)).toEqual(['debug', 'info', 'warn', 'error'])
    expect(entries.every((entry) => Object.keys(entry.fields).length === 0)).toBe(true)
  })

  it('keeps bindings and lets the call override them', () => {
    const { entries, sink } = capture()
    const logger = createLogger({
      name: 'pdf',
      sink,
      now,
      bindings: { requestId: 'r1', module: 'pdf' },
    })

    logger.warn('render failed', { module: 'print' })

    expect(entries[0]?.fields).toEqual({ requestId: 'r1', module: 'print' })
  })

  it('redacts secret fields, including nested objects, without changing the input', () => {
    const { entries, sink } = capture()
    const logger = createLogger({ name: 'auth', sink, now })
    const fields = {
      loginName: 'buyer',
      password: 'plain',
      nested: { serviceRole: 'key', count: 1 },
    }

    logger.error('login failed', fields)

    expect(entries[0]?.fields).toEqual({
      loginName: 'buyer',
      password: '[redacted]',
      nested: { serviceRole: '[redacted]', count: 1 },
    })
    expect(fields.password).toBe('plain')
  })

  it('rejects a blank name', () => {
    expect(() => createLogger({ name: '  ', sink: () => undefined })).toThrow(
      'Logger name is required',
    )
  })
})

describe('createConsoleLogger', () => {
  it('writes one console line and does not share state between loggers', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const first = createConsoleLogger('web')
    const second = createConsoleLogger('server')

    first.info('ready')
    second.error('down', { apiKey: 'secret' })

    expect(info).toHaveBeenCalledTimes(1)
    expect(String(info.mock.calls[0]?.[0])).toContain('[web] ready')
    expect(error).toHaveBeenCalledTimes(1)
    expect(error.mock.calls[0]?.[1]).toEqual({ apiKey: '[redacted]' })
    info.mockRestore()
    error.mockRestore()
  })
})
