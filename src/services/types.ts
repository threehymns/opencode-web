// Define types that might not be exported or need adaptation
export interface Provider {
  id: string
  name: string
  env: string[]
  models: Record<string, Model>
}

export interface Model {
  id: string
  name: string
  release_date: string
  attachment: boolean
  reasoning: boolean
  temperature: boolean
  tool_call: boolean
  cost: {
    input: number
    output: number
    cache_read?: number
    cache_write?: number
  }
  limit: {
    context: number
    output: number
  }
}

export interface ProvidersResponse {
  providers: Provider[]
  default: Record<string, string>
}

// Import SDK types
import type { TextPartInput, FilePartInput, AgentPartInput, Project, Session } from '@opencode-ai/sdk/client'

// Re-export SDK types for convenience
export type { Project, Session }

// Request Types (adapted for SDK)
export interface SendMessageRequest {
  model: { providerID: string; modelID: string }
  parts: (TextPartInput | FilePartInput | AgentPartInput)[]
  noReply?: boolean
}

// Event Stream Types (adapted for SDK events)
export interface StreamEvent {
  type: string
  properties: Record<string, unknown>
}

// Error Types
export interface ApiError {
  data: Record<string, unknown>
}

export interface AppError extends Error {
  code?: string
  statusCode?: number
  data?: unknown
}

// Todo Types
export interface TodoItem {
  content: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  id: string
  priority: 'high' | 'medium' | 'low'
}

export const isTodoArgs = (args?: Record<string, unknown>): args is { todos: TodoItem[] } => {
  return args != null &&
         Array.isArray(args.todos) &&
         args.todos.every(todo =>
           typeof todo === 'object' &&
           todo != null &&
           typeof todo.content === 'string' &&
           typeof todo.status === 'string' &&
           typeof todo.id === 'string' &&
           typeof todo.priority === 'string'
         )
}

// Config Types
export interface Config {
  API_BASE_URL: string
  DEFAULT_PROVIDER: string
  DEFAULT_MODEL: string
  EVENT_STREAM_URL: string
}