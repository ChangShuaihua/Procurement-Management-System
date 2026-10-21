import type { Logger } from '@purchase/log'
import { isLoopbackUrl, LOCAL_SUPABASE_URL } from './profiles'
import { EnvError, type AppEnv, type EnvSource, type NodeEnv } from './schema'

function blankToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? ''
  return trimmed === '' ? undefined : trimmed
}

function readRequired(source: EnvSource, name: string): string {
  const value = blankToUndefined(source[name])
  if (value === undefined) {
    throw new EnvError(`${name} is required`)
  }
  return value
}

function readAppEnv(source: EnvSource): AppEnv {
  const value = blankToUndefined(source.APP_ENV) ?? 'local'
  if (value === 'local' || value === 'production') {
    return value
  }
  throw new EnvError('APP_ENV must be local or production')
}

function readUrl(value: string, name: string): string {
  try {
    return new URL(value).toString().replace(/\/$/, '')
  } catch (error) {
    throw new EnvError(`${name} must be a valid URL`, { cause: error })
  }
}

export function loadNodeEnv(source: EnvSource, logger: Logger): NodeEnv {
  const appEnv = readAppEnv(source)
  const apiBaseUrl = readUrl(readRequired(source, 'API_BASE_URL'), 'API_BASE_URL')
  const configuredUrl = blankToUndefined(source.SUPABASE_URL)
  const supabaseUrl = readUrl(
    appEnv === 'local' ? (configuredUrl ?? LOCAL_SUPABASE_URL) : readRequired(source, 'SUPABASE_URL'),
    'SUPABASE_URL',
  )
  if (appEnv === 'production' && isLoopbackUrl(supabaseUrl)) {
    throw new EnvError('SUPABASE_URL must not point at the local machine in production')
  }
  const supabaseServiceRoleKey = readRequired(source, 'SUPABASE_SERVICE_ROLE_KEY')
  logger.info('loaded node env', { appEnv, apiBaseUrl, supabaseUrl })
  return { appEnv, apiBaseUrl, supabaseUrl, supabaseServiceRoleKey }
}
