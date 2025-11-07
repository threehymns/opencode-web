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
			const index = state.messages.findIndex((msg) => msg.info.id === info.id);
			if (index === -1) {
				return { messages: [...state.messages, { info, parts: [] }] };
			}
			const existing = state.messages[index];
			if (existing.info === info) {
				return state;
			}
			const nextMessages = state.messages.slice();
			nextMessages[index] = { ...existing, info };
			return { messages: nextMessages };
		});
	},

	handlePartUpdated: (part: Part) => {
		set((state) => {
			const messageIndex = state.messages.findIndex(
				(msg) => msg.info.id === part.messageID,
			);
			if (messageIndex === -1) {
				return state;
			}
			const message = state.messages[messageIndex];
			const existingPartIndex = message.parts.findIndex((p) => p.id === part.id);
			if (
				existingPartIndex !== -1 &&
				message.parts[existingPartIndex] === part
			) {
				return state;
			}
			const nextMessages = state.messages.slice();
			const nextParts = message.parts.slice();
			if (existingPartIndex !== -1) {
				nextParts[existingPartIndex] = part;
			} else {
				nextParts.push(part);
			}
			nextMessages[messageIndex] = { ...message, parts: nextParts };
			return { messages: nextMessages };
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

		set((state) => ({ messages: [...state.messages, userMessage] }));
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
