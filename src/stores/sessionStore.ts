import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSession, deleteSession, listSessions } from "../services/api";
import type { Session } from "../services/types";
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
			updateSessionTitle: (sessionId: string, title: string) => void;
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

			updateSessionTitle: (sessionId: string, title: string) => {
				set((state) => ({
					sessions: state.sessions.map((session) =>
						session.id === sessionId ? { ...session, title } : session,
					),
					currentSession:
						state.currentSession?.id === sessionId
							? { ...state.currentSession, title }
							: state.currentSession,
				}));
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
