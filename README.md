# @stewrd/sdk

TypeScript SDK for the [Stewrd](https://stewrd.dev) Agent API.

## Install

```bash
npm install @stewrd/sdk
```

## Quickstart

```typescript
import { Stewrd } from '@stewrd/sdk'

const stewrd = new Stewrd('sk-stw_your_key')

const result = await stewrd.agent.run({
  message: 'Research the top 5 CRM tools',
  capabilities: ['research', 'documents'],
})

console.log(result.message)
console.log(result.files[0].url)
```

## Streaming

```typescript
const stream = await stewrd.agent.stream({
  message: 'Write a detailed analysis',
})

for await (const event of stream) {
  if (event.type === 'token') process.stdout.write(event.content)
  if (event.type === 'tool_start') console.log(`Using ${event.tool}...`)
  if (event.type === 'done') console.log('\n\nTokens:', event.usage.total_tokens)
}
```

You can also collect the full response after streaming:

```typescript
const stream = await stewrd.agent.stream({ message: 'Hello' })
const response = await stream.finalResponse()
console.log(response.message)
```

## Configuration

```typescript
const stewrd = new Stewrd('sk-stw_...', {
  baseUrl: 'https://api.stewrd.dev', // default
  timeout: 120000,                   // default, in ms
})
```

## API Reference

### `new Stewrd(apiKey, options?)`

Create a new client instance.

| Param | Type | Description |
|-------|------|-------------|
| `apiKey` | `string` | Your Stewrd API key (`sk-stw_...`) |
| `options.baseUrl` | `string` | API base URL (default: `https://api.stewrd.dev`) |
| `options.timeout` | `number` | Request timeout in ms (default: `120000`) |

### `stewrd.agent.run(params)`

Run the agent synchronously. Returns `Promise<AgentResponse>`.

| Param | Type | Description |
|-------|------|-------------|
| `params.message` | `string` | The instruction for the agent |
| `params.capabilities` | `string[]` | Capabilities to enable (e.g. `['research', 'documents']`) |
| `params.files` | `InputFile[]` | Files to include as context |

### `stewrd.agent.stream(params)`

Run the agent with streaming. Returns `Promise<AgentStream>`.

Takes the same params as `run()`. The returned `AgentStream` is an `AsyncIterable<StreamEvent>`.

### Stream Events

| Event | Fields | Description |
|-------|--------|-------------|
| `token` | `content: string` | A chunk of response text |
| `tool_start` | `tool: string` | A tool invocation started |
| `tool_end` | `tool: string` | A tool invocation finished |
| `done` | `response, usage` | Stream complete with full response |
| `error` | `error: { code, message }` | An error occurred |

### `StewrdError`

Thrown on non-2xx API responses.

```typescript
import { StewrdError } from '@stewrd/sdk'

try {
  await stewrd.agent.run({ message: '...' })
} catch (err) {
  if (err instanceof StewrdError) {
    console.log(err.status)  // 401
    console.log(err.code)    // 'invalid_api_key'
    console.log(err.message) // 'Invalid API key'
    console.log(err.docs)    // 'https://docs.stewrd.dev/errors/invalid_api_key'
  }
}
```

## Requirements

- Node.js 18+
- TypeScript 5+ (for type definitions)

## License

MIT
