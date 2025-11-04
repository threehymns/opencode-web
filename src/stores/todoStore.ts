import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Todo {
	content: string;
	status: "pending" | "in_progress" | "completed" | "cancelled";
	priority: "high" | "medium" | "low";
	id: string;
}

interface TodoState {
	todos: Record<string, Todo[]>; // keyed by sessionId
	currentSessionId: string | null;

	// Actions
	setCurrentSessionId: (sessionId: string | null) => void;
	addTodo: (todo: Todo) => void;
	updateTodo: (id: string, updates: Partial<Todo>) => void;
	deleteTodo: (id: string) => void;
	getTodosForSession: (sessionId: string) => Todo[];
	clearTodosForSession: (sessionId: string) => void;
}

export const useTodoStore = create<TodoState>()(
	persist(
		(set, get) => ({
			todos: {},
			currentSessionId: null,

			setCurrentSessionId: (sessionId) => set({ currentSessionId: sessionId }),

			addTodo: (todo) =>
				set((state) => {
					const sessionId = state.currentSessionId;
					if (!sessionId) return state;
					const sessionTodos = state.todos[sessionId] || [];
					return {
						todos: {
							...state.todos,
							[sessionId]: [...sessionTodos, todo],
						},
					};
				}),

			updateTodo: (id, updates) =>
				set((state) => {
					const sessionId = state.currentSessionId;
					if (!sessionId) return state;
					const sessionTodos = state.todos[sessionId] || [];
					return {
						todos: {
							...state.todos,
							[sessionId]: sessionTodos.map((todo) =>
								todo.id === id ? { ...todo, ...updates } : todo,
							),
						},
					};
				}),

			deleteTodo: (id) =>
				set((state) => {
					const sessionId = state.currentSessionId;
					if (!sessionId) return state;
					const sessionTodos = state.todos[sessionId] || [];
					return {
						todos: {
							...state.todos,
							[sessionId]: sessionTodos.filter((todo) => todo.id !== id),
						},
					};
				}),

			getTodosForSession: (sessionId) => {
				return get().todos[sessionId] || [];
			},

			clearTodosForSession: (sessionId) =>
				set((state) => {
					const newTodos = { ...state.todos };
					delete newTodos[sessionId];
					return { todos: newTodos };
				}),
		}),
		{
			name: "todo-store",
			partialize: (state) => ({ todos: state.todos }),
		},
	),
);
