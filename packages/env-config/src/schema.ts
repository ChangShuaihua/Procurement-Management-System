export class EnvError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'EnvError'
  }
}

export type AppEnv = 'local' | 'production'

export type EnvSource = Record<string, string | undefined>

export interface NodeEnv {
  appEnv: AppEnv
  apiBaseUrl: string
  supabaseUrl: string
  supabaseServiceRoleKey: string
}

export interface BrowserEnv {
  apiBaseUrl: string
}
