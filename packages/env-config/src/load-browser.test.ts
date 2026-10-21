import { createLogger } from '@purchase/log'
import { describe, expect, it } from 'vitest'
import { loadBrowserEnv } from './index'

describe('loadBrowserEnv', () => {
  it('returns only the API address', () => {
    const logger = createLogger({ name: 'env-config', sink: () => undefined })
    const env = loadBrowserEnv(
      {
        API_BASE_URL: 'https://api.example.com/',
        SUPABASE_SERVICE_ROLE_KEY: 'should-not-leak',
      },
      logger,
    )

    expect(env).toEqual({ apiBaseUrl: 'https://api.example.com' })
  })

  it('rejects a missing API address', () => {
    const logger = createLogger({ name: 'env-config', sink: () => undefined })
    expect(() => loadBrowserEnv({}, logger)).toThrow('API_BASE_URL is required')
  })
})
