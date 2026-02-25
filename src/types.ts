/** Options for the Stewrd client constructor. */
export interface StewrdOptions {
  /** Base URL for the API. Defaults to `https://api.stewrd.dev`. */
  baseUrl?: string
  /** Request timeout in milliseconds. Defaults to `120000` (2 minutes). */
  timeout?: number
}

/** A file attached to the agent request. */
export interface InputFile {
  /** Publicly accessible URL of the file. */
  url: string
  /** Optional display name for the file. */
  name?: string
}

/** A file returned in the agent response. */
export interface ResponseFile {
  /** Unique file identifier. */
  id: string
  /** File display name. */
  name: string
  /** Publicly accessible URL of the file. */
  url: string
  /** MIME type of the file. */
  mime_type: string
  /** File size in bytes. */
  size_bytes: number
}

/** Token usage breakdown. */
export interface Usage {
  /** Number of input tokens consumed. */
  input_tokens: number
  /** Number of output tokens generated. */
  output_tokens: number
  /** Total tokens (input + output). */
  total_tokens: number
}

/** Response metadata. */
export interface Meta {
  /** Model used for the request. */
  model: string
  /** Time to complete in milliseconds. */
  duration_ms: number
}

/** Parameters for `stewrd.agent.run()` and `stewrd.agent.stream()`. */
export interface AgentRunParams {
  /** The user message / instruction for the agent. */
  message: string
  /** Capabilities to enable for this run (e.g. `['research', 'documents']`). */
  capabilities?: string[]
  /** Files to include as context. */
  files?: InputFile[]
  /** @internal Set by the SDK — do not pass directly. */
  stream?: boolean
}

/** Synchronous response from `stewrd.agent.run()`. */
export interface AgentResponse {
  /** Unique run identifier. */
  id: string
  /** Object type — always `"agent.run"`. */
  object: string
  /** The agent's text response. */
  message: string
  /** Capabilities that were actually used. */
  capabilities_used: string[]
  /** Files produced by the agent. */
  files: ResponseFile[]
  /** Token usage for this run. */
  usage: Usage
  /** Run metadata. */
  meta: Meta
}

// ---------------------------------------------------------------------------
// Stream events
// ---------------------------------------------------------------------------

export interface TokenEvent {
  type: 'token'
  /** A chunk of the agent's response text. */
  content: string
}

export interface ToolStartEvent {
  type: 'tool_start'
  /** Name of the tool being invoked. */
  tool: string
}

export interface ToolEndEvent {
  type: 'tool_end'
  /** Name of the tool that finished. */
  tool: string
}

export interface DoneEvent {
  type: 'done'
  /** The full agent response (same shape as the sync response). */
  response: AgentResponse
  /** Token usage for this run. */
  usage: Usage
}

export interface StreamErrorEvent {
  type: 'error'
  /** Error details. */
  error: {
    code: string
    message: string
  }
}

/** Union of all SSE event types emitted during a streaming run. */
export type StreamEvent =
  | TokenEvent
  | ToolStartEvent
  | ToolEndEvent
  | DoneEvent
  | StreamErrorEvent

// ---------------------------------------------------------------------------
// Error shape returned by the API
// ---------------------------------------------------------------------------

/** Shape of an error response body from the API. */
export interface StewrdErrorData {
  code: string
  message: string
  docs?: string
}
