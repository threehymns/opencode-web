import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Session } from "@/services/types";
import {
  createSession,
  deleteSession,
  listSessions,
  updateSessionTitle as apiUpdateSessionTitle,
} from "@/services/api";
import { useTodoStore } from "./todoStore";

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  isLoadingSessions: boolean;
  isCreatingSession: boolean;
  error: string | null;

  // Actions
  fetchSessions: () => Promise<void>;
  createNewSession: (title?: string, projectId?: string) => Promise<Session>;
  setCurrentSession: (session: Session | null) => void;
  deleteSessionById: (sessionId: string) => Promise<void>;
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>;
  clearError: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSession: null,
      isLoadingSessions: false,
      isCreatingSession: false,
      error: null,

      fetchSessions: async () => {
        const { isLoadingSessions } = get();

        if (isLoadingSessions) {
          return;
        }

        set({ isLoadingSessions: true, error: null });

        try {
          const sessions = await listSessions();
          // Sort sessions by creation date (newest first)
          const sortedSessions = sessions.sort(
            (a, b) => b.time.created - a.time.created,
          );
          set({ sessions: sortedSessions, isLoadingSessions: false });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          set({
            error: `Failed to load sessions - ${errorMessage}`,
            isLoadingSessions: false,
          });
        }
      },

      createNewSession: async (title?: string): Promise<Session> => {
        set({ isCreatingSession: true, error: null });

        try {
          // For now, create session without specifying project - SDK will use current directory
          // TODO: Update when SDK supports project selection in session creation
          const newSession = await createSession(title);

          // Add to sessions list and set as current
          const { sessions } = get();
          const updatedSessions = [newSession, ...sessions];
          set({
            sessions: updatedSessions,
            currentSession: newSession,
            isCreatingSession: false,
          });

          return newSession;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          set({
            error: `Failed to create session - ${errorMessage}`,
            isCreatingSession: false,
          });
          throw error;
        }
      },

      setCurrentSession: (session: Session | null) => {
        set({ currentSession: session });
      },

      updateSessionTitle: async (sessionId: string, title: string) => {
        const trimmed = title.trim();
        if (!trimmed) {
          return;
        }

        // Optimistic local update
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId ? { ...session, title: trimmed } : session,
          ),
          currentSession:
            state.currentSession?.id === sessionId
              ? { ...state.currentSession, title: trimmed }
              : state.currentSession,
          error: null,
        }));

        try {
          const updated = await apiUpdateSessionTitle(sessionId, trimmed);

          // Reconcile with server response (in case other fields changed)
          set((state) => ({
            sessions: state.sessions.map((session) =>
              session.id === sessionId ? updated : session,
            ),
            currentSession:
              state.currentSession?.id === sessionId
                ? updated
                : state.currentSession,
          }));
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";

          // Best-effort resync with backend to avoid stale UI
          try {
            const sessions = await listSessions();
            set({
              sessions,
              error: `Failed to update session title - ${message}`,
            });
          } catch {
            set({
              error: `Failed to update session title - ${message}`,
            });
          }
        }
      },

      deleteSessionById: async (sessionId: string) => {
        try {
          await deleteSession(sessionId);

          // Remove from sessions list
          const { sessions, currentSession } = get();
          const updatedSessions = sessions.filter((s) => s.id !== sessionId);

          // If deleted session was current, clear current session
          const newCurrentSession =
            currentSession?.id === sessionId ? null : currentSession;

          set({
            sessions: updatedSessions,
            currentSession: newCurrentSession,
          });

          // Clean up todos for the deleted session
          useTodoStore.getState().clearTodosForSession(sessionId);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          set({
            error: `Failed to delete session - ${errorMessage}`,
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "opencode-session-state",
      partialize: (state) => ({
        currentSession: state.currentSession,
      }),
    },
  ),
);
