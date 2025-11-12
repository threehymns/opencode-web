import type { Message, Part } from "@opencode-ai/sdk/client";
import { useEffect, useMemo, useState } from "react";
import { logger } from "../lib/logger";
import { createEventStream } from "../services/eventStream";
import { useMessageStore } from "../stores/messageStore";
import { useSessionStore } from "../stores/sessionStore";

export function useEventStream() {
	const [hasReceivedFirstEvent, setHasReceivedFirstEvent] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const eventStream = useMemo(() => createEventStream(), []); // Persistent event stream
	const { handleMessageUpdated, handlePartUpdated, handleMessageRemoved } =
		useMessageStore();

	useEffect(() => {
		const connectAndSubscribe = async () => {
			await eventStream.connect();

			eventStream.subscribe(
				"message.updated",
				(data: Record<string, unknown>) => {
					if (!hasReceivedFirstEvent) {
						setHasReceivedFirstEvent(true);
					}

					// Type guard for message update event
					const isMessageUpdate = (
						d: Record<string, unknown>,
					): d is { info: Message } => {
						return typeof d.info === "object" && d.info !== null;
					};

					if (isMessageUpdate(data)) {
						// Get current session dynamically to avoid stale closure
						const { currentSession: activeSession } =
							useSessionStore.getState();
						if (data.info.sessionID === activeSession?.id) {
							// Update messageStoreV2 with the new message
							handleMessageUpdated(data.info);

							// Check if message is completed
							const info = data.info as Record<string, unknown>;
							const time = info.time;
							if (
								time &&
								typeof time === "object" &&
								"completed" in (time as Record<string, unknown>) &&
								(time as { completed?: boolean }).completed
							) {
								setIsLoading(false);
							}
						}
					}
				},
			);

			eventStream.subscribe(
				"message.part.updated",
				(data: Record<string, unknown>) => {
					if (!hasReceivedFirstEvent) {
						setHasReceivedFirstEvent(true);
					}

					// Type guard for part update event
					const isPartUpdate = (
						d: Record<string, unknown>,
					): d is { part: Part } => {
						return typeof d.part === "object" && d.part !== null;
					};

					if (isPartUpdate(data)) {
						// Get current session dynamically to avoid stale closure
						const { currentSession: activeSession } =
							useSessionStore.getState();
						if (data.part.sessionID === activeSession?.id) {
							// Update messageStoreV2 with the new part
							handlePartUpdated(data.part);
						}
					}
				},
			);

			eventStream.subscribe(
				"message.removed",
				(data: Record<string, unknown>) => {
					const isMessageRemoved = (
						d: Record<string, unknown>,
					): d is { messageID: string } => {
						return typeof d.messageID === "string";
					};

					if (isMessageRemoved(data)) {
						// Get current session dynamically
						const { currentSession: activeSession } =
							useSessionStore.getState();
						// Find the message to check its sessionID
						const { messages } = useMessageStore.getState();
						const message = messages.find(
							(msg) => msg.info.id === data.messageID,
						);
						if (message && message.info.sessionID === activeSession?.id) {
							handleMessageRemoved(data.messageID);
						}
					}
				},
			);

			eventStream.subscribe(
				"session.error",
				(data: Record<string, unknown>) => {
					logger.error("Session error:", data);
				},
			);

			eventStream.subscribe("session.idle", (data: Record<string, unknown>) => {
				const isSessionIdle = (
					d: Record<string, unknown>,
				): d is { sessionID: string } => {
					return typeof d.sessionID === "string";
				};

				if (isSessionIdle(data)) {
					// Get current session dynamically
					const { currentSession: activeSession } = useSessionStore.getState();
					if (data.sessionID === activeSession?.id) {
						// Note: setIdle removed from new sessionStore
						setIsLoading(false);
					}
				}
			});
		};

		connectAndSubscribe();

		return () => {
			eventStream.disconnect();
		};
	}, [
		eventStream,
		handleMessageRemoved, // Update messageStoreV2 with the new message
		handleMessageUpdated, // Update messageStoreV2 with the new part
		handlePartUpdated,
		hasReceivedFirstEvent,
	]);

	return {
		hasReceivedFirstEvent,
		setHasReceivedFirstEvent,
		isLoading,
		setIsLoading,
	};
}
