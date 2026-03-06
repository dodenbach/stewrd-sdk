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

/** A custom tool definition for function calling. */
export interface ToolDefinition {
  /** Tool name — alphanumeric and underscores only, max 64 chars. */
  name: string
  /** Description of what the tool does, max 1024 chars. */
  description: string
  /** JSON Schema for the tool parameters. Must have `type: "object"`. */
  parameters: {
    type: 'object'
    properties?: Record<string, unknown>
    required?: string[]
    [key: string]: unknown
  }
}

/** A tool call returned by the agent when it needs to invoke a custom tool. */
export interface ToolCall {
  /** Unique identifier for this tool call. Pass back with the output. */
  id: string
  /** Name of the tool to invoke. */
  name: string
  /** Parsed arguments for the tool. */
  arguments: Record<string, unknown>
}

/** A tool output to submit back to the agent. */
export interface ToolOutput {
  /** The `id` from the tool call. */
  tool_call_id: string
  /** The result of executing the tool (max 100KB). */
  output: string
}

/** Request and token usage for a run. */
export interface Usage {
  /** Credits consumed for this request (0 on tool output continuations). */
  credits_this_request?: number
  /** Credits remaining in this billing period. */
  credits_remaining?: number
  /** Tokens consumed for this request. */
  tokens_used?: number
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
  /** Custom tools the agent can call. When provided, only `chat` capability is used. */
  tools?: ToolDefinition[]
  /** @internal Set by the SDK — do not pass directly. */
  stream?: boolean
}

/** Parameters for `stewrd.agent.submitToolOutputs()`. */
export interface ToolOutputParams {
  /** The request ID from the initial agent response. */
  requestId: string
  /** Array of tool outputs to submit. */
  toolOutputs: ToolOutput[]
  /** Compute instance ID for machine affinity routing. */
  computeInstance?: string
}

/** Synchronous response from `stewrd.agent.run()`. */
export interface AgentResponse {
  /** Unique run identifier. */
  id: string
  /** Object type — always `"agent.response"`. */
  object: string
  /** Response status — `"completed"` or `"requires_tool_outputs"`. */
  status: 'completed' | 'requires_tool_outputs'
  /** The agent's text response. Present when `status` is `"completed"`. */
  message?: string
  /** Tool calls the agent wants to make. Present when `status` is `"requires_tool_outputs"`. */
  tool_calls?: ToolCall[]
  /** Capabilities that were actually used. */
  capabilities_used?: string[]
  /** Files produced by the agent. */
  files?: ResponseFile[]
  /** Token usage for this run. */
  usage: Usage
  /** Run metadata. */
  meta?: Meta
  /** Compute instance ID — pass back with tool outputs for machine affinity routing. */
  _compute_instance?: string
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
