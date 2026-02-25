import type { StewrdErrorData } from './types'

/**
 * Error thrown when the Stewrd API returns a non-2xx response.
 *
 * Includes the HTTP status code, a machine-readable error `code`,
 * the human-readable `message`, and an optional `docs` URL.
 */
export class StewrdError extends Error {
  /** Machine-readable error code (e.g. `"invalid_api_key"`). */
  readonly code: string
  /** HTTP status code of the response. */
  readonly status: number
  /** Link to relevant documentation, if provided. */
  readonly docs: string | undefined

  constructor(status: number, data: StewrdErrorData) {
    super(data.message)
    this.name = 'StewrdError'
    this.code = data.code
    this.status = status
    this.docs = data.docs
  }
}
