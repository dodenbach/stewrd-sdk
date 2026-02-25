import type { AgentRunParams, AgentResponse, StewrdOptions } from './types'
import { StewrdError } from './errors'
import { AgentStream } from './streaming'

const DEFAULT_BASE_URL = 'https://api.stewrd.dev'
const DEFAULT_TIMEOUT = 120_000

/**
 * Stewrd SDK client.
 *
 * ```ts
 * import { Stewrd } from '@stewrd/sdk'
 *
 * const stewrd = new Stewrd('sk-stw_your_key')
 * const result = await stewrd.agent.run({ message: 'Hello' })
 * ```
 */
export class Stewrd {
  private apiKey: string
  private baseUrl: string
  private timeout: number

  /** Namespace for agent operations. */
  readonly agent: {
    /** Run the agent and wait for the full response. */
    run: (params: AgentRunParams) => Promise<AgentResponse>
    /** Run the agent with streaming — returns an async iterable of events. */
    stream: (params: AgentRunParams) => Promise<AgentStream>
  }

  constructor(apiKey: string, options: StewrdOptions = {}) {
    if (!apiKey) {
      throw new Error(
        'An API key is required. Pass it as the first argument: new Stewrd("sk-stw_...")'
      )
    }

    this.apiKey = apiKey
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '')
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT

    // Bind agent methods so they can be destructured
    this.agent = {
      run: this.agentRun.bind(this),
      stream: this.agentStream.bind(this),
    }
  }

  // ---------------------------------------------------------------------------
  // Agent methods
  // ---------------------------------------------------------------------------

  private async agentRun(params: AgentRunParams): Promise<AgentResponse> {
    const response = await this.request('/v1/agent', {
      ...params,
      stream: false,
    })

    const body = await response.json()
    return body as AgentResponse
  }

  private async agentStream(params: AgentRunParams): Promise<AgentStream> {
    const response = await this.request('/v1/agent', {
      ...params,
      stream: true,
    })

    if (!response.body) {
      throw new Error('Streaming response has no body')
    }

    return new AgentStream(response.body)
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private async request(
    path: string,
    body: Record<string, unknown>
  ): Promise<Response> {
    const url = `${this.baseUrl}${path}`

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'User-Agent': '@stewrd/sdk/1.0.0',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!response.ok) {
        let errorData: { code: string; message: string; docs?: string }
        try {
          const parsed = await response.json()
          errorData = {
            code: parsed.code ?? 'unknown_error',
            message: parsed.message ?? response.statusText,
            docs: parsed.docs,
          }
        } catch {
          errorData = {
            code: 'unknown_error',
            message: response.statusText,
          }
        }

        throw new StewrdError(response.status, errorData)
      }

      return response
    } catch (error) {
      if (error instanceof StewrdError) throw error

      if (
        error instanceof DOMException &&
        (error as DOMException).name === 'AbortError'
      ) {
        throw new StewrdError(408, {
          code: 'request_timeout',
          message: `Request timed out after ${this.timeout}ms`,
        })
      }

      throw error
    } finally {
      clearTimeout(timer)
    }
  }
}
