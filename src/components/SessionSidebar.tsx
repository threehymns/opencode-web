import { useState, useMemo } from 'react'
import { useSessionStore } from '@/stores/sessionStore'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { PlusIcon, MessageSquareIcon } from 'lucide-react'
import { ModeToggle } from '@/components/mode-toggle'
import type { Session } from '@/services/types'

interface SessionSidebarProps {
  onNewSession: () => void
  onSelectSession: (session: Session) => void
}

export function SessionSidebar({ onNewSession, onSelectSession }: SessionSidebarProps) {
  const { sessions, currentSession, isLoadingSessions } = useSessionStore()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const groupedSessions = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const groups: Record<string, Session[]> = {
      Today: [],
      Yesterday: [],
      'This Week': [],
      Older: []
    }

    sessions.forEach(session => {
      const sessionDate = new Date(session.time.created)
      const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate())

      if (sessionDay.getTime() === today.getTime()) {
        groups.Today.push(session)
      } else if (sessionDay.getTime() === yesterday.getTime()) {
        groups.Yesterday.push(session)
      } else if (sessionDay >= weekAgo) {
        groups['This Week'].push(session)
      } else {
        groups.Older.push(session)
      }
    })

    // Sort sessions within each group by creation time (newest first)
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => b.time.created - a.time.created)
    })

    return groups
  }, [sessions])

  return (
    <div className={`flex flex-col h-full bg-background border-r ${isCollapsed ? 'w-12' : 'w-64'}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold">Sessions</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0"
          >
            <MessageSquareIcon className="h-4 w-4" />
          </Button>
        </div>
        {!isCollapsed && (
          <Button
            onClick={onNewSession}
            className="w-full mt-2"
            size="sm"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Session
          </Button>
        )}
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1 h-full">
        <div className="p-2 min-h-full">
          {isLoadingSessions ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {!isCollapsed && 'No sessions yet'}
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {Object.entries(groupedSessions).map(([groupName, groupSessions]) => {
                if (groupSessions.length === 0) return null

                return (
                  <div key={groupName} className="space-y-1">
                    {!isCollapsed && (
                      <h3 className="text-xs font-medium text-muted-foreground px-2 py-1">
                        {groupName}
                      </h3>
                    )}
                    <div className="space-y-1">
                      {groupSessions.map((session) => (
                        <Button
                          key={session.id}
                          variant={currentSession?.id === session.id ? "secondary" : "ghost"}
                          className={`w-full justify-start h-auto p-3 ${isCollapsed ? 'px-2' : ''}`}
                          onClick={() => onSelectSession(session)}
                        >
                          <div className="flex items-start space-x-2 w-full">
                            <MessageSquareIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {!isCollapsed && (
                              <div className="flex-1 min-w-0 text-left">
                                <div className="text-sm font-medium truncate">
                                  {session.title || 'Untitled Session'}
                                </div>
                              </div>
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      <Separator />

       {/* Footer */}
       <div className="p-4 flex items-center justify-between">
         {!isCollapsed && (
           <div className="text-xs text-muted-foreground">
             {sessions.length} session{sessions.length !== 1 ? 's' : ''}
           </div>
         )}
         <ModeToggle />
       </div>
    </div>
  )
}