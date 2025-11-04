import { useState, useEffect, useCallback } from 'react'
import { useSessionStore } from '../stores/sessionStore'
// import { useMessageStore } from '../stores/messageStore'
import { useEventStream } from './useEventStream'
import { useMessageHandling } from './useMessageHandling'
import { DEFAULT_SETTINGS } from '../utils/constants'

export function useChatSession() {
  const [selectedMode, setSelectedMode] = useState<string>(DEFAULT_SETTINGS.MODE)

  const { currentSession, isCreatingSession, error: sessionError, fetchSessions } = useSessionStore()
  // const { addErrorMessage } = useMessageStore()

  const { hasReceivedFirstEvent, setHasReceivedFirstEvent, isLoading, setIsLoading } = useEventStream()
  const { handleMessageSubmit } = useMessageHandling()

  // Fetch sessions on hook initialization
  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Display session error if any
  useEffect(() => {
    if (sessionError) {
      // TODO: Handle error display with messageStoreV2
      console.error('Session error:', sessionError)
    }
  }, [sessionError])

  const submitMessage = useCallback(async (userInput: string) => {
    if (!currentSession) {
      console.error('No current session selected')
      return
    }

    await handleMessageSubmit(
      userInput,
      isLoading,
      setIsLoading,
      hasReceivedFirstEvent,
      setHasReceivedFirstEvent,
      currentSession.id
    )
  }, [handleMessageSubmit, isLoading, setIsLoading, hasReceivedFirstEvent, setHasReceivedFirstEvent, currentSession])

  return {
    // Session state
    currentSession,
    isCreatingSession,
    isLoading,

    // Mode management
    selectedMode,
    setSelectedMode,

    // Message submission
    submitMessage,

    // Computed states
    isDisabled: isLoading || !currentSession || isCreatingSession
  }
}