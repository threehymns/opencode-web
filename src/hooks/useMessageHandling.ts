import { useCallback } from 'react'
import { sendMessage } from '../services/api'
import { createTextMessageRequest } from '../utils/apiHelpers'
import { useSessionStore } from '../stores/sessionStore'
import { useModelStore } from '../stores/modelStore'
import { useMessageStoreV2 } from '../stores/messageStoreV2'
import { logger } from '../lib/logger'

export function useMessageHandling() {
  const { currentSession, isCreatingSession } = useSessionStore()
  const { selectedModel, getProviderForModel } = useModelStore()
  const { addUserMessage, addAssistantMessage } = useMessageStoreV2()

  const handleMessageSubmit = useCallback(async (
    userInput: string,
    isLoading: boolean,
    setIsLoading: (loading: boolean) => void,
    _hasReceivedFirstEvent: boolean,
    setHasReceivedFirstEvent: (received: boolean) => void,
    sessionId?: string
  ) => {
    const activeSessionId = sessionId || currentSession?.id
    if (!userInput || !activeSessionId || isLoading || isCreatingSession) return

    setIsLoading(true)
    setHasReceivedFirstEvent(false)
    // Note: setIdle removed from new sessionStore

    // Add user message to messageStoreV2
    const messageId = `user-${Date.now()}`
    addUserMessage(userInput, messageId, activeSessionId)

    try {
      // Get the correct provider for the selected model
      const providerId = getProviderForModel(selectedModel)
      const message = createTextMessageRequest(userInput, providerId, selectedModel)

      const response = await sendMessage(activeSessionId, message)

      // Immediately add the assistant message to the store with initial parts
      const messageWithParts = { info: response.info, parts: response.parts }
      addAssistantMessage(messageWithParts)

      // Event stream will continue updating with additional parts

    } catch (error) {
      logger.error('Failed to send message:', error)
      // Note: Error handling might need to be updated for messageStoreV2
    } finally {
      setIsLoading(false)
    }
  }, [currentSession?.id, isCreatingSession, selectedModel, getProviderForModel, addUserMessage, addAssistantMessage])

  return {
    handleMessageSubmit
  }
}