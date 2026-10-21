import { EnvError } from './schema'

export const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321'

export function isLoopbackUrl(value: string): boolean {
  let hostname: string
  try {
    hostname = new URL(value).hostname
  } catch (error) {
    throw new EnvError('SUPABASE_URL must be a valid URL', { cause: error })
  }
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}
