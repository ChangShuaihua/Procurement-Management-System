import { createLogger, type LogEntry, type Logger, type LogSink } from './logger'

function writeToConsole(entry: LogEntry): void {
  const line = `${entry.time} ${entry.level} [${entry.name}] ${entry.message}`
  const write =
    entry.level === 'error'
      ? console.error
      : entry.level === 'warn'
        ? console.warn
        : entry.level === 'debug'
          ? console.debug
          : console.info
  if (Object.keys(entry.fields).length === 0) {
    write(line)
    return
  }
  write(line, entry.fields)
}

export function createConsoleSink(): LogSink {
  return writeToConsole
}

export function createConsoleLogger(name: string): Logger {
  return createLogger({ name, sink: createConsoleSink() })
}
