import { logger } from "../lib/logger";
import { getSDKClient } from "./api";
import type { StreamEvent } from "./types";

// Event listener type
type EventListener<T = unknown> = (data: T) => void;

// EventStream service using SDK event subscription
export class EventStreamService {
	private listeners: Map<string, EventListener[]> = new Map();
	private eventSubscription: AsyncIterableIterator<unknown> | null = null;
	private isConnected = false;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectDelay = 1000;
	private abortController: AbortController | null = null;

	constructor() {
		// Expose debug object globally in development
		if (import.meta.env.DEV) {
			(
				window as { __eventStreamDebug?: EventStreamService }
			).__eventStreamDebug = this;
		}
	}

	// Connect to the event stream using SDK
	async connect(): Promise<void> {
		if (this.eventSubscription) {
			await this.disconnect();
		}

		try {
			this.abortController = new AbortController();
			const client = await getSDKClient();
			const events = await client.event.subscribe();

			this.isConnected = true;
			this.reconnectAttempts = 0;

			// Start processing events
			this.processEvents(events.stream);
		} catch (error) {
			logger.error("Failed to connect to event stream:", error);
			this.handleReconnect();
		}
	}

	// Disconnect from the event stream
	async disconnect(): Promise<void> {
		if (this.abortController) {
			this.abortController.abort();
			this.abortController = null;
		}

		this.eventSubscription = null;
		this.isConnected = false;
		this.listeners.clear();
		this.reconnectAttempts = 0;
	}

	// Process events from SDK subscription
	private async processEvents(
		stream: AsyncIterableIterator<unknown>,
	): Promise<void> {
		try {
			for await (const event of stream) {
				if (this.abortController?.signal.aborted) break;

				try {
					// Convert SDK event format to our StreamEvent format
					const isEventLike = (
						e: unknown,
					): e is { type: string; properties: Record<string, unknown> } => {
						const obj = e as Record<string, unknown>;
						return (
							typeof obj === "object" &&
							obj !== null &&
							typeof obj.type === "string" &&
							typeof obj.properties === "object" &&
							obj.properties !== null
						);
					};

					if (!isEventLike(event)) {
						logger.warn("Received malformed event:", event);
						continue;
					}

					const eventData = event as {
						type: string;
						properties: Record<string, unknown>;
					};

					const streamEvent: StreamEvent = {
						type: eventData.type,
						properties: eventData.properties,
					};

					logger.debug(
						"📨 Received SDK event:",
						streamEvent.type,
						streamEvent.properties,
					);
					this.handleEvent(streamEvent);
				} catch (error) {
					logger.error("Failed to process event:", error);
				}
			}
		} catch (error) {
			if (!this.abortController?.signal.aborted) {
				logger.error("Event stream error:", error);
				this.handleReconnect();
			}
		} finally {
			this.isConnected = false;
		}
	}

	// Subscribe to specific event types
	subscribe<T = unknown>(
		eventType: string,
		callback: EventListener<T>,
	): () => void {
		if (!this.listeners.has(eventType)) {
			this.listeners.set(eventType, []);
		}

		this.listeners.get(eventType)?.push(callback as EventListener);

		// Return unsubscribe function
		return () => {
			const callbacks = this.listeners.get(eventType);
			if (callbacks) {
				const index = callbacks.indexOf(callback as EventListener);
				if (index > -1) {
					callbacks.splice(index, 1);
				}
			}
		};
	}

	// Handle incoming events
	private handleEvent(event: StreamEvent): void {
		const callbacks = this.listeners.get(event.type);
		if (callbacks) {
			callbacks.forEach((callback) => {
				try {
					callback(event.properties);
				} catch (error) {
					logger.error(`Error in event callback for ${event.type}:`, error);
				}
			});
		}
	}

	// Handle reconnection logic
	private async handleReconnect(): Promise<void> {
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			logger.error("Max reconnection attempts reached");
			return;
		}

		this.reconnectAttempts++;
		const delay = this.reconnectDelay * 2 ** (this.reconnectAttempts - 1);

		logger.info(
			`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`,
		);

		setTimeout(async () => {
			await this.connect();
		}, delay);
	}

	// Get connection state
	get connectionState(): boolean {
		return this.isConnected;
	}

	// Debug methods
	getDebugInfo() {
		return {
			isConnected: this.isConnected,
			listeners: Object.fromEntries(
				Array.from(this.listeners.entries()).map(([key, callbacks]) => [
					key,
					callbacks.length,
				]),
			),
			reconnectAttempts: this.reconnectAttempts,
		};
	}
}

// Functional API for event streaming
export const createEventStream = (): EventStreamService => {
	return new EventStreamService();
};

// Hook-friendly event stream utilities
export const subscribeToMessageUpdates = (
	eventStream: EventStreamService,
	callback: EventListener,
) => {
	return eventStream.subscribe("message.updated", callback);
};

export const subscribeToMessagePartUpdates = (
	eventStream: EventStreamService,
	callback: EventListener,
) => {
	return eventStream.subscribe("message.part.updated", callback);
};

export const subscribeToSessionErrors = (
	eventStream: EventStreamService,
	callback: EventListener,
) => {
	return eventStream.subscribe("session.error", callback);
};

export const subscribeToSessionIdle = (
	eventStream: EventStreamService,
	callback: EventListener,
) => {
	return eventStream.subscribe("session.idle", callback);
};

// Default export
export default EventStreamService;
