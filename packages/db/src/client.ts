import type { NodeEnv } from '@purchase/env-config'
import type { Logger } from '@purchase/log'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database'

export function createSupabaseClient(env: NodeEnv, logger: Logger): SupabaseClient<Database> {
  logger.info('connecting supabase', { appEnv: env.appEnv, supabaseUrl: env.supabaseUrl })
  return createClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
