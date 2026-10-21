export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogFields = Readonly<Record<string, unknown>>

export interface LogEntry {
  time: string
  level: LogLevel
  name: string
  message: string
  fields: LogFields
}

export type LogSink = (entry: LogEntry) => void

export interface Logger {
  debug(message: string, fields?: LogFields): void
  info(message: string, fields?: LogFields): void
  warn(message: string, fields?: LogFields): void
  error(message: string, fields?: LogFields): void
}

export interface CreateLoggerOptions {
  name: string
  sink: LogSink
  bindings?: LogFields
  now?: () => Date
}

const SECRET_KEY = /password|secret|token|credential|authorization|api[-_]?key|service[-_]?role/i

function isPlainObject(value: unknown): value is LogFields {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function redactFields(fields: LogFields): LogFields {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(fields)) {
    if (SECRET_KEY.test(key)) {
      result[key] = '[redacted]'
    } else if (isPlainObject(value)) {
      result[key] = redactFields(value)
    } else {
      result[key] = value
    }
  }
  return result
}

export function createLogger(options: CreateLoggerOptions): Logger {
  const name = options.name.trim()
  if (name === '') {
    throw new Error('Logger name is required')
  }
  const bindings = options.bindings ?? {}
  const now = options.now ?? (() => new Date())
  const write = (level: LogLevel, message: string, fields?: LogFields): void => {
    options.sink({
      time: now().toISOString(),
      level,
      name,
      message,
      fields: redactFields({ ...bindings, ...fields }),
    })
  }
  return {
    debug: (message, fields) => write('debug', message, fields),
    info: (message, fields) => write('info', message, fields),
    warn: (message, fields) => write('warn', message, fields),
    error: (message, fields) => write('error', message, fields),
  }
}
