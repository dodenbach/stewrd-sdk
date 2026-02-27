import type { AgentResponse, StreamEvent } from './types'

/**
 * Async-iterable wrapper around an SSE stream from the Stewrd Agent API.
 *
 * Usage:
 * ```ts
 * const stream = await stewrd.agent.stream({ message: '...' })
 * for await (const event of stream) {
 *   if (event.type === 'token') process.stdout.write(event.content)
 * }
 * ```
 */
export class AgentStream implements AsyncIterable<StreamEvent> {
  private reader: ReadableStreamDefaultReader<Uint8Array>
  private decoder = new TextDecoder()
  private buffer = ''
  private done = false
  private _finalResponse: AgentResponse | null = null

  constructor(body: ReadableStream<Uint8Array>) {
    this.reader = body.getReader()
  }

  /**
   * Consume the entire stream and return the final `AgentResponse`.
   * Useful when you want streaming progress but ultimately need the full response.
   */
  async finalResponse(): Promise<AgentResponse> {
    for await (const event of this) {
      if (event.type === 'done') {
        return event.response
      }
    }

    if (this._finalResponse) {
      return this._finalResponse
    }

    throw new Error('Stream ended without a done event')
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<StreamEvent> {
    while (!this.done) {
      const { value, done } = await this.reader.read()

      if (done) {
        this.done = true
        // Process any remaining data in the buffer
        const events = this.parseBuffer(true)
        for (const event of events) {
          if (event.type === 'done') this._finalResponse = event.response
          yield event
        }
        break
      }

      this.buffer += this.decoder.decode(value, { stream: true })
      const events = this.parseBuffer(false)
      for (const event of events) {
        if (event.type === 'done') this._finalResponse = event.response
        yield event
      }
    }
  }

  /**
   * Parse SSE events from the internal buffer.
   *
   * SSE format:
   * ```
   * event: <type>\n
   * data: <json>\n
   * \n
   * ```
   */
  private parseBuffer(flush: boolean): StreamEvent[] {
    const events: StreamEvent[] = []
    const separator = '\n\n'

    let idx: number
    while ((idx = this.buffer.indexOf(separator)) !== -1) {
      const raw = this.buffer.slice(0, idx)
      this.buffer = this.buffer.slice(idx + separator.length)

      const event = this.parseSSEBlock(raw)
      if (event) events.push(event)
    }

    // On flush, try to parse whatever remains
    if (flush && this.buffer.trim().length > 0) {
      const event = this.parseSSEBlock(this.buffer)
      if (event) events.push(event)
      this.buffer = ''
    }

    return events
  }

  private parseSSEBlock(block: string): StreamEvent | null {
    let eventType = ''
    let data = ''

    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) {
        eventType = line.slice('event:'.length).trim()
      } else if (line.startsWith('data:')) {
        data += line.slice('data:'.length).trim()
      }
    }

    if (!eventType || !data) return null

    try {
      const parsed = JSON.parse(data)

      switch (eventType) {
        case 'token':
          return { type: 'token', content: parsed.text ?? parsed.content ?? '' }
        case 'tool_start':
          return { type: 'tool_start', tool: parsed.tool }
        case 'tool_end':
          return { type: 'tool_end', tool: parsed.tool }
        case 'done': {
          // API sends flat: {request_id, message, files, tokens_used, duration_ms}
          // Build AgentResponse from flat or nested shape
          const response = parsed.response ?? {
            id: parsed.request_id ?? parsed.id ?? '',
            object: 'agent.response',
            message: parsed.message ?? '',
            capabilities_used: parsed.capabilities_used ?? [],
            files: parsed.files ?? [],
            usage: {
              requests_used: parsed.requests_used ?? 0,
              requests_limit: parsed.requests_limit ?? 0,
              tokens_used: parsed.tokens_used ?? 0,
            },
            meta: {
              duration_ms: parsed.duration_ms ?? 0,
              project_id: parsed.project_id ?? '',
              plan: parsed.plan ?? '',
            },
          }
          const usage = parsed.usage ?? response.usage ?? {
            requests_used: 0,
            requests_limit: 0,
            tokens_used: parsed.tokens_used ?? 0,
          }
          return { type: 'done', response, usage }
        }
        case 'error':
          return {
            type: 'error',
            error: { code: parsed.code, message: parsed.message },
          }
        default:
          return null
      }
    } catch {
      return null
    }
  }
}
