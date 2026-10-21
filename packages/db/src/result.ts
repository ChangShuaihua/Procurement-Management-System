export class DbError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DbError'
  }
}

export function throwOnError(error: { message: string } | null): void {
  if (error) {
    throw new DbError(error.message)
  }
}
