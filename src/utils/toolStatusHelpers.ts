// Simplified tool status helpers for SDK compatibility

import type { Part } from '@opencode-ai/sdk'

// Get pending action message for tool
export const getToolActionMessage = (toolName: string): string => {
  const actionMessages: Record<string, string> = {
    'read': 'Reading file...',
    'write': 'Writing file...',
    'edit': 'Editing file...',
    'bash': 'Running command...',
    'webfetch': 'Fetching URL...',
    'glob': 'Searching files...',
    'grep': 'Searching text...',
    'todowrite': 'Updating tasks...',
    'todoread': 'Reading tasks...'
  }
  return actionMessages[toolName] || 'Working...'
}

// Get display name for tool
export const getToolDisplayName = (toolName: string): string => {
  const displayNames: Record<string, string> = {
    'read': 'Read',
    'write': 'Write',
    'edit': 'Edit',
    'bash': 'Run',
    'webfetch': 'Fetch',
    'glob': 'Search',
    'grep': 'Find',
    'todowrite': 'Tasks',
    'todoread': 'Tasks'
  }
  return displayNames[toolName] || toolName
}

// Simplified tool status functions
export const getOverallToolStatus = (parts: Part[]): string => {
  const toolParts = parts.filter((part) => part.type === 'tool')
  if (toolParts.length === 0) return 'Processing...'

  const activeTools = toolParts.filter((part) => {
    const partObj = part as Record<string, unknown>
    const state = partObj.state
    return !state || typeof state !== 'object' || (state as { status?: string }).status !== 'completed'
  })
  if (activeTools.length > 0) {
    const toolPart = activeTools[0] as Record<string, unknown>
    const tool = toolPart.tool
    return getToolActionMessage(tool as string)
  }

  return 'Completed'
}

export const hasActiveToolExecution = (_info: Record<string, unknown>, parts: Part[]): boolean => {
  return parts.some((part) => {
    if (part.type !== 'tool') return false
    const partObj = part as Record<string, unknown>
    const state = partObj.state
    return !state || typeof state !== 'object' || (state as { status?: string }).status !== 'completed'
  })
}

export const getToolProgress = (parts: Part[]): { current: number; total: number } => {
  const toolParts = parts.filter((part) => part.type === 'tool')
  const completed = toolParts.filter((part) => {
    const partObj = part as Record<string, unknown>
    const state = partObj.state
    return state && typeof state === 'object' && (state as { status?: string }).status === 'completed'
  }).length
  return { current: completed, total: toolParts.length }
}

export const getContextualToolStatus = (part: Part): string => {
  if (part.type === 'tool') {
    const partObj = part as Record<string, unknown>
    const state = partObj.state
    if (state && typeof state === 'object') {
      const status = (state as { status?: string }).status
      const tool = partObj.tool

      if (status === 'pending') {
        return getToolActionMessage(tool as string)
      } else if (status === 'running') {
        return `${getToolDisplayName(tool as string)}...`
      } else if (status === 'completed') {
        return `✓ ${getToolDisplayName(tool as string)} completed`
      } else if (status === 'error') {
        return `❌ ${getToolDisplayName(tool as string)} failed`
      }
    }
  }

  return 'Processing...'
}