import { memo, useCallback, useEffect, useRef, useState } from "react";
import { AppSidebar } from "./components/AppSidebar";
import { ChatContainer } from "./components/Chat/ChatContainer";
import { MessageInput } from "./components/Chat/MessageInput";
import { NewSessionDialog } from "./components/NewSessionDialog";
import { RightSidebar } from "./components/RightSidebar";
import { SettingsPanel } from "./components/Settings/SettingsPanel";
import { ThemeProvider } from "./components/theme-provider";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "./components/ui/sidebar";
import { useEventStream } from "./hooks/useEventStream";
import { useMessageHandling } from "./hooks/useMessageHandling";
import { getSessionMessages } from "./services/api";
import type { Session } from "./services/types";
import { useMessageStore } from "./stores/messageStore";
import { useProjectStore } from "./stores/projectStore";
import { useSessionStore } from "./stores/sessionStore";
import type { Todo } from "./stores/todoStore";
import { useTodoStore } from "./stores/todoStore";
import { DEFAULT_SETTINGS } from "./utils/constants";

const MemoizedSettingsPanel = memo(SettingsPanel);

function App() {
	const [selectedMode, setSelectedMode] = useState<string>(
		DEFAULT_SETTINGS.MODE,
	);
	const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
	const [isLoadingSession, setIsLoadingSession] = useState(false);

	const {
		sessions,
		currentSession,
		isCreatingSession,
		error: sessionError,
		fetchSessions,
		setCurrentSession,
	} = useSessionStore();
	const { fetchProjects } = useProjectStore();
	const { messages, hydrateFromSession } = useMessageStore();
	const { setCurrentSessionId } = useTodoStore();

	const {
		hasReceivedFirstEvent,
		setHasReceivedFirstEvent,
		isLoading,
		setIsLoading,
	} = useEventStream();
	const { handleMessageSubmit } = useMessageHandling();

	// Fetch sessions and projects on app initialization
	useEffect(() => {
		fetchSessions();
		fetchProjects();
	}, [fetchSessions, fetchProjects]);

	// Load messages for current session on app start
	useEffect(() => {
		if (currentSession && sessions.length > 0) {
			// Only load if we have sessions loaded (to avoid loading before sessions are fetched)
			const loadCurrentSessionMessages = async () => {
				try {
					const messages = await getSessionMessages(currentSession.id);
					hydrateFromSession(messages);
				} catch (error) {
					console.error("Failed to load current session messages:", error);
					hydrateFromSession([]);
				}
			};
			loadCurrentSessionMessages();
		}
	}, [currentSession?.id, sessions.length, hydrateFromSession, currentSession]);

	// Update todo store with current session
	useEffect(() => {
		setCurrentSessionId(currentSession?.id || null);
	}, [currentSession?.id, setCurrentSessionId]);

	const lastProcessedIndex = useRef(-1);

	// Refresh todos from the most recent todo tool call in the chat
	useEffect(() => {
		if (!currentSession || messages.length === 0) return;

		// Find the most recent todowrite tool call
		for (let i = messages.length - 1; i > lastProcessedIndex.current; i--) {
			const message = messages[i];
			if (message.info.role === "assistant" && message.parts) {
				for (const part of message.parts) {
					if (
						part.type === "tool" &&
						(part as any).tool === "todowrite" &&
						(part as any).state?.status === "completed"
					) {
						try {
							// Get todos from the tool state output
							const state = (part as any).state;
							let todos: Todo[] = [];

							if (Array.isArray(state.output)) {
								todos = state.output;
							} else if (typeof state.output === "string") {
								const parsed = JSON.parse(state.output);
								if (Array.isArray(parsed)) {
									todos = parsed;
								} else if (parsed && Array.isArray(parsed.todos)) {
									todos = parsed.todos;
								}
							} else if (
								state.output &&
								typeof state.output === "object" &&
								Array.isArray(state.output.todos)
							) {
								todos = state.output.todos;
							}
							// Clear existing todos and add the new ones
							const { clearTodosForSession, addTodo } = useTodoStore.getState();
							clearTodosForSession(currentSession.id);
							todos.forEach((todo) => addTodo(todo));
							lastProcessedIndex.current = i;
							return; // Stop after finding the most recent
						} catch (error) {
							console.error("Failed to parse todos from tool call:", error);
						}
					}
				}
			}
		}
	}, [currentSession?.id, messages, currentSession]);

	// Display session error if any
	useEffect(() => {
		if (sessionError) {
			// TODO: Handle error display with messageStoreV2
			console.error("Session error:", sessionError);
		}
	}, [sessionError]);

	const onMessageSubmit = useCallback(
		async (userInput: string) => {
			await handleMessageSubmit(
				userInput,
				isLoading,
				setIsLoading,
				hasReceivedFirstEvent,
				setHasReceivedFirstEvent,
				currentSession?.id,
			);
		},
		[
			handleMessageSubmit,
			isLoading,
			setIsLoading,
			hasReceivedFirstEvent,
			setHasReceivedFirstEvent,
			currentSession?.id,
		],
	);

	const handleNewSession = () => {
		setShowNewSessionDialog(true);
	};

	const handleSelectSession = async (session: Session) => {
		const isSameSession = currentSession?.id === session.id;
		setCurrentSession(session);

		// Only load messages if this is a different session or if we have no messages
		if (!isSameSession || messages.length === 0) {
			setIsLoadingSession(true);
			// Clear current messages while loading
			hydrateFromSession([]);

			// Load messages for the selected session
			try {
				const sessionMessages = await getSessionMessages(session.id);
				hydrateFromSession(sessionMessages);
			} catch (error) {
				console.error("Failed to load session messages:", error);
				// On error, keep messages cleared but log the error
				// The UI will show empty state appropriately
			} finally {
				setIsLoadingSession(false);
			}
		}
	};

	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<SidebarProvider>
				<AppSidebar
					onNewSession={handleNewSession}
					onSelectSession={handleSelectSession}
				/>
				<SidebarInset>
					<header className="flex h-16 shrink-0 items-center gap-2 px-4">
						<SidebarTrigger className="-ml-1" />
					</header>
					<div className="flex flex-col flex-1 max-w-4xl p-4">
						<ChatContainer isLoadingSession={isLoadingSession} />

						<div className="space-y-2">
							<MemoizedSettingsPanel
								selectedMode={selectedMode}
								onModeChange={setSelectedMode}
							/>

							<MessageInput
								onSubmit={onMessageSubmit}
								disabled={isLoading || !currentSession || isCreatingSession}
								isLoading={isLoading}
								isInitializing={isCreatingSession}
							/>
						</div>
					</div>
				</SidebarInset>

				<RightSidebar />

				<NewSessionDialog
					open={showNewSessionDialog}
					onOpenChange={setShowNewSessionDialog}
				/>
			</SidebarProvider>
		</ThemeProvider>
	);
}

export default App;
