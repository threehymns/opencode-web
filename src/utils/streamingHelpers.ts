import type { Message, Part } from '@opencode-ai/sdk'

// Simplified streaming helpers for SDK compatibility
export interface StreamingState {
  isStreaming: boolean
  isComplete: boolean
  hasToolExecution: boolean
  currentStep: number
  totalSteps: number
}

// Simplified streaming check
export const isMessageStreaming = (info: Message, _parts: Part[], sessionIdle = false): boolean => {
  // Simplified: check if AssistantMessage and not completed
  if (info.role === 'assistant' && 'time' in info && !info.time.completed && !sessionIdle) {
    return true
  }
  return false
}

// Get streaming state for a message
export const getStreamingState = (info: Message, parts: Part[], sessionIdle = false): StreamingState => {
  const isStreaming = isMessageStreaming(info, parts, sessionIdle)
  const isComplete = (info.role === 'assistant' && 'time' in info && !!info.time.completed) || sessionIdle

  // Count steps and tool executions
  const stepStarts = parts.filter((part) => part.type === 'step-start').length
  const toolInvocations = parts.filter((part) => part.type === 'tool').length

  return {
    isStreaming,
    isComplete,
    hasToolExecution: toolInvocations > 0,
    currentStep: stepStarts,
    totalSteps: isComplete ? stepStarts : stepStarts + 1 // +1 if still streaming
  }
}

// Check if a specific tool is still executing
export const isToolExecuting = (_info: Message, parts: Part[], toolId: string): boolean => {
  const toolPart = parts.find((part) =>
    part.type === 'tool' &&
    'id' in part && (part as { id: string }).id === toolId
  )

  if (!toolPart) return false
  const toolPartObj = toolPart as Record<string, unknown>
  const state = toolPartObj.state
  if (!state || typeof state !== 'object') return false
  return (state as { status?: string }).status !== 'completed'
}

// Get the current streaming status text
export const getStreamingStatusText = (state: StreamingState): string => {
  if (state.isComplete) {
    return 'Complete'
  }

  if (state.hasToolExecution) {
    return `Executing tools... (Step ${state.currentStep})`
  }

  return 'Thinking...'
}

// Check if message has any content to display
export const hasDisplayableContent = (_info: Message, parts: Part[]): boolean => {
  return parts.some((part) =>
    part.type === 'text' ||
    part.type === 'tool'
  )
}

// Check if we should show a typing indicator
export const shouldShowTypingIndicator = (info: Message, parts: Part[], sessionIdle = false): boolean => {
  const state = getStreamingState(info, parts, sessionIdle)

  // Show typing if streaming and either:
  // 1. No content yet
  // 2. Last part is step-start (more content coming)
  if (!state.isStreaming) {
    return false
  }

  const hasContent = hasDisplayableContent(info, parts)
  const lastPart = parts[parts.length - 1]

  return !hasContent || lastPart?.type === 'step-start'
}