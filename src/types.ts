/** Options for the Stewrd client constructor. */
export interface StewrdOptions {
  /** Base URL for the API. Defaults to `https://api.stewrd.dev`. */
  baseUrl?: string
  /** Request timeout in milliseconds. Defaults to `120000` (2 minutes). */
  timeout?: number
}

/** A file attached to the agent request. */
export interface InputFile {
  /** File name with extension. */
  name: string
  /** File contents as a string. */
  content: string
}

/** A file returned in the agent response. */
export interface ResponseFile {
  /** File name. */
  name: string
  /** File contents as a string. */
  content?: string
  /** Download URL for the generated file (when available). */
  url?: string
}

/** Request and token usage for a run. */
export interface Usage {
  /** Requests consumed this billing period. */
  requests_used: number
  /** Your plan's monthly request quota. */
  requests_limit: number
  /** Tokens consumed for this request. */
  tokens_used: number
}

/** Response metadata. */
export interface Meta {
  /** Time to complete in milliseconds. */
  duration_ms: number
  /** The project this request was made against. */
  project_id: string
  /** Your current plan. */
  plan: string
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
  /** Object type — always `"agent.response"`. */
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
