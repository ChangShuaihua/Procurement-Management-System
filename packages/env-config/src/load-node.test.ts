import { createLogger, type LogEntry } from '@purchase/log'
import { describe, expect, it } from 'vitest'
import { EnvError, loadNodeEnv, LOCAL_SUPABASE_URL } from './index'

function capture(): { entries: LogEntry[]; logger: ReturnType<typeof createLogger> } {
  const entries: LogEntry[] = []
  const logger = createLogger({ name: 'env-config', sink: (entry) => entries.push(entry) })
  return { entries, logger }
}

describe('loadNodeEnv', () => {
  it('defaults to the local Supabase URL and keeps the service key out of the log', () => {
    const { entries, logger } = capture()
    const env = loadNodeEnv(
      { API_BASE_URL: 'http://127.0.0.1:3000/', SUPABASE_SERVICE_ROLE_KEY: 'local-key' },
      logger,
    )

    expect(env).toEqual({
      appEnv: 'local',
      apiBaseUrl: 'http://127.0.0.1:3000',
      supabaseUrl: LOCAL_SUPABASE_URL,
      supabaseServiceRoleKey: 'local-key',
    })
    expect(JSON.stringify(entries)).not.toContain('local-key')
  })

  it('requires an explicit hosted URL in production', () => {
    const { logger } = capture()
    expect(() =>
      loadNodeEnv(
        { APP_ENV: 'production', API_BASE_URL: 'https://api.example.com', SUPABASE_SERVICE_ROLE_KEY: 'k' },
        logger,
      ),
    ).toThrow(EnvError)
    expect(() =>
      loadNodeEnv(
        {
          APP_ENV: 'production',
          API_BASE_URL: 'https://api.example.com',
          SUPABASE_URL: 'http://127.0.0.1:54321',
          SUPABASE_SERVICE_ROLE_KEY: 'k',
        },
        logger,
      ),
    ).toThrow('must not point at the local machine')
  })

  it('loads a hosted project', () => {
    const { logger } = capture()
    const env = loadNodeEnv(
      {
        APP_ENV: 'production',
        API_BASE_URL: 'https://api.example.com',
        SUPABASE_URL: 'https://project.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'hosted-key',
      },
      logger,
    )
    expect(env.supabaseUrl).toBe('https://project.supabase.co')
    expect(env.appEnv).toBe('production')
  })
})
