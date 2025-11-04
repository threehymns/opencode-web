import type { Message, Part } from "@opencode-ai/sdk";
import { create } from "zustand";

// SDK-aligned types
export interface MessageWithParts {
	info: Message;
	parts: Part[];
}

interface MessageStoreState {
	messages: MessageWithParts[];

	// Session management
	hydrateFromSession: (messages: MessageWithParts[]) => void;

	// Event stream handlers
	handleMessageUpdated: (info: Message) => void;
	handlePartUpdated: (part: Part) => void;
	handleMessageRemoved: (messageId: string) => void;

	// User actions
	addUserMessage: (
		content: string,
		messageId: string,
		sessionId: string,
	) => void;
	addAssistantMessage: (messageWithParts: MessageWithParts) => void;
	clearMessages: () => void;
}

export const useMessageStore = create<MessageStoreState>((set) => ({
	messages: [],

	hydrateFromSession: (messages: MessageWithParts[]) => {
		set({ messages });
	},

	handleMessageUpdated: (info: Message) => {
		set((state) => {
			const existingIndex = state.messages.findIndex(
				(msg) => msg.info.id === info.id,
			);
			if (existingIndex >= 0) {
				const updatedMessages = [...state.messages];
				updatedMessages[existingIndex] = {
					...updatedMessages[existingIndex],
					info,
				};
				return { messages: updatedMessages };
			} else {
				return {
					messages: [...state.messages, { info, parts: [] }],
				};
			}
		});
	},

	handlePartUpdated: (part: Part) => {
		set((state) => {
			const messageIndex = state.messages.findIndex(
				(msg) => msg.info.id === part.messageID,
			);
			if (messageIndex >= 0) {
				const updatedMessages = [...state.messages];
				const message = updatedMessages[messageIndex];
				const partIndex = message.parts.findIndex((p) => p.id === part.id);

				if (partIndex >= 0) {
					message.parts[partIndex] = part;
				} else {
					message.parts.push(part);
				}

				return { messages: updatedMessages };
			}
			return state;
		});
	},

	handleMessageRemoved: (messageId: string) => {
		set((state) => ({
			messages: state.messages.filter((msg) => msg.info.id !== messageId),
		}));
	},

	addUserMessage: (content: string, messageId: string, sessionId: string) => {
		const userMessage: MessageWithParts = {
			info: {
				id: messageId,
				sessionID: sessionId,
				role: "user",
				time: { created: Date.now() },
			},
			parts: [
				{
					id: `${messageId}-text`,
					sessionID: sessionId,
					messageID: messageId,
					type: "text",
					text: content,
					time: { start: Date.now() },
				},
			],
		};

		set((state) => ({
			messages: [...state.messages, userMessage],
		}));
	},

	addAssistantMessage: (messageWithParts: MessageWithParts) => {
		set((state) => {
			// Check if message already exists
			const existingIndex = state.messages.findIndex(
				(msg) => msg.info.id === messageWithParts.info.id,
			);
			if (existingIndex >= 0) {
				// Update existing message
				const updatedMessages = [...state.messages];
				updatedMessages[existingIndex] = messageWithParts;
				return { messages: updatedMessages };
			} else {
				// Add new message
				return { messages: [...state.messages, messageWithParts] };
			}
		});
	},

	clearMessages: () => {
		set({ messages: [] });
	},
}));
