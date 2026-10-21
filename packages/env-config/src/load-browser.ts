import type { Logger } from '@purchase/log'
import { EnvError, type BrowserEnv, type EnvSource } from './schema'

export function loadBrowserEnv(source: EnvSource, logger: Logger): BrowserEnv {
  const value = source.API_BASE_URL?.trim() ?? ''
  if (value === '') {
    throw new EnvError('API_BASE_URL is required')
  }
  let apiBaseUrl: string
  try {
    apiBaseUrl = new URL(value).toString().replace(/\/$/, '')
  } catch (error) {
    throw new EnvError('API_BASE_URL must be a valid URL', { cause: error })
  }
  logger.info('loaded browser env', { apiBaseUrl })
  return { apiBaseUrl }
}
