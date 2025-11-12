import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Circle,
  CircleIcon,
  ClockIcon,
  MessageSquareIcon,
  MoreHorizontal,
  PlusIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { Session } from "@/services/types";
import { useSessionStore } from "@/stores/sessionStore";
import { useTodoStore } from "@/stores/todoStore";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface AppSidebarProps {
  onNewSession: () => void;
  onSelectSession: (session: Session) => void;
}

export function AppSidebar({ onNewSession, onSelectSession }: AppSidebarProps) {
  const { sessions, currentSession, isLoadingSessions } = useSessionStore();
  const { getTodosForSession } = useTodoStore();
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(
    new Set(),
  );
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");

  const groupedSessions = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups: Record<string, Session[]> = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      Older: [],
    };

    sessions.forEach((session) => {
      const sessionDate = new Date(session.time.created);
      const sessionDay = new Date(
        sessionDate.getFullYear(),
        sessionDate.getMonth(),
        sessionDate.getDate(),
      );

      if (sessionDay.getTime() === today.getTime()) {
        groups.Today.push(session);
      } else if (sessionDay.getTime() === yesterday.getTime()) {
        groups.Yesterday.push(session);
      } else if (sessionDay >= weekAgo) {
        groups["This Week"].push(session);
      } else {
        groups.Older.push(session);
      }
    });

    // Sort sessions within each group by creation time (newest first)
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => b.time.created - a.time.created);
    });

    return groups;
  }, [sessions]);

  const getSessionTodoStats = (sessionId: string) => {
    const todos = getTodosForSession(sessionId);
    const pending = todos.filter(
      (todo) => todo.status === "pending" || todo.status === "in_progress",
    ).length;
    const completed = todos.filter(
      (todo) => todo.status === "completed",
    ).length;
    return { total: todos.length, pending, completed };
  };

  const toggleSessionExpansion = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="h-3 w-3 text-green-500" />;
      case "in_progress":
        return <ClockIcon className="h-3 w-3 text-blue-500" />;
      default:
        return <CircleIcon className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <Button
          onClick={onNewSession}
          className="w-full"
          size="sm"
          variant="outline"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </SidebarHeader>

      <SidebarContent>
        {isLoadingSessions ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 bg-muted rounded animate-pulse" />
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : sessions.length === 0 ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="text-center text-muted-foreground py-8">
                No sessions yet
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          Object.entries(groupedSessions).map(([groupName, groupSessions]) => {
            if (groupSessions.length === 0) return null;

            return (
              <SidebarGroup key={groupName}>
                <SidebarGroupLabel>{groupName}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {groupSessions.map((session) => {
                      const todoStats = getSessionTodoStats(session.id);
                      const isExpanded = expandedSessions.has(session.id);
                      const isEditing = editingSessionId === session.id;

                      return (
                        <SidebarMenuItem key={session.id}>
                          <SidebarMenuButton
                            isActive={currentSession?.id === session.id}
                            onClick={() => {
                              if (!isEditing) {
                                onSelectSession(session);
                              }
                            }}
                            tooltip={session.title || "Untitled Session"}
                            className="group"
                          >
                            {todoStats.total > 0 ? (
                              <div className="flex items-center gap-1">
                                {todoStats.pending > 0 && (
                                  <span className="text-xs text-orange-500 font-medium">
                                    {todoStats.pending}
                                  </span>
                                )}
                                {todoStats.total > 0 &&
                                  todoStats.pending === 0 && (
                                    <CheckCircleIcon className="h-3 w-3 text-green-500" />
                                  )}
                                {todoStats.total > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSessionExpansion(session.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    {isExpanded ? (
                                      <ChevronDownIcon className="h-3 w-3" />
                                    ) : (
                                      <ChevronRightIcon className="h-3 w-3" />
                                    )}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <></>
                            )}
                            {isEditing ? (
                              <input
                                className="flex-1 min-w-0 px-1 py-0.5 text-xs border rounded bg-background"
                                value={editingTitle}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                  setEditingTitle(e.target.value)
                                }
                                onBlur={() => {
                                  const trimmed = editingTitle.trim();
                                  if (trimmed && editingSessionId) {
                                    useSessionStore
                                      .getState()
                                      .updateSessionTitle(
                                        editingSessionId,
                                        trimmed,
                                      );
                                  }
                                  setEditingSessionId(null);
                                  setEditingTitle("");
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    const trimmed = editingTitle.trim();
                                    if (trimmed && editingSessionId) {
                                      useSessionStore
                                        .getState()
                                        .updateSessionTitle(
                                          editingSessionId,
                                          trimmed,
                                        );
                                    }
                                    setEditingSessionId(null);
                                    setEditingTitle("");
                                  }
                                  if (e.key === "Escape") {
                                    e.preventDefault();
                                    setEditingSessionId(null);
                                    setEditingTitle("");
                                  }
                                }}
                              />
                            ) : (
                              <span className="flex-1 truncate">
                                {session.title || "Untitled Session"}
                              </span>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <SidebarMenuAction className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal />
                                </SidebarMenuAction>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent side="right" align="start">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSessionId(session.id);
                                    setEditingTitle(
                                      session.title || "Untitled Session",
                                    );
                                  }}
                                >
                                  Rename
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </SidebarMenuButton>
                          {isExpanded && todoStats.total > 0 && (
                            <SidebarMenuSub>
                              {getTodosForSession(session.id).map((todo) => (
                                <SidebarMenuSubItem key={todo.id}>
                                  <SidebarMenuSubButton className="h-auto py-1">
                                    <div className="flex items-start gap-2 w-full">
                                      {getStatusIcon(todo.status)}
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs truncate">
                                          {todo.content}
                                        </div>
                                        <div className="text-xs text-muted-foreground capitalize">
                                          {todo.priority}
                                        </div>
                                      </div>
                                    </div>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          )}
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""}
          </div>
          <ModeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
