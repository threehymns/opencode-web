import { useMemo } from 'react'
import { useSessionStore } from '@/stores/sessionStore'
import { useTodoStore } from '@/stores/todoStore'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { CheckCircleIcon, CircleIcon, ClockIcon, XCircleIcon } from 'lucide-react'

interface ChangedFile {
  file: string
  added: number
  removed: number
}

export function RightSidebar() {
  const { currentSession } = useSessionStore()
  const { getTodosForSession } = useTodoStore()

  const todos = useMemo(() => {
    if (!currentSession) return []
    return getTodosForSession(currentSession.id)
  }, [currentSession, getTodosForSession])

  // Placeholder for changed files - in a real implementation, this would come from git diff
  const changedFiles: ChangedFile[] = [
    // Example data - replace with actual git diff stats
    // { file: 'src/components/AppSidebar.tsx', added: 45, removed: 12 },
    // { file: 'src/App.tsx', added: 10, removed: 5 },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <ClockIcon className="h-4 w-4 text-blue-500" />
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4 text-red-500" />
      default:
        return <CircleIcon className="h-4 w-4 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <Sidebar side="right">
      <SidebarHeader>
        <h2 className="text-lg font-semibold">Session Details</h2>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Todos ({todos.length})</SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-48">
              {todos.length === 0 ? (
                <div className="text-sm text-muted-foreground p-2">
                  No todos for this session
                </div>
              ) : (
                <SidebarMenu>
                  {todos.map((todo) => (
                    <SidebarMenuItem key={todo.id} className="flex items-start gap-2 p-2">
                      {getStatusIcon(todo.status)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {todo.content}
                        </div>
                        <div className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${getPriorityColor(todo.priority) === 'destructive' ? 'border-destructive text-destructive hover:bg-destructive/10' : getPriorityColor(todo.priority) === 'default' ? 'border-border bg-background hover:bg-accent hover:text-accent-foreground' : 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80'} mt-1`}>
                          {todo.priority}
                        </div>
                      </div>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              )}
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        <SidebarGroup>
          <SidebarGroupLabel>Changed Files ({changedFiles.length})</SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-48">
              {changedFiles.length === 0 ? (
                <div className="text-sm text-muted-foreground p-2">
                  No changes detected
                </div>
              ) : (
                <SidebarMenu>
                  {changedFiles.map((file, index) => (
                    <SidebarMenuItem key={index} className="p-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {file.file}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          +{file.added} -{file.removed}
                        </div>
                      </div>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              )}
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}