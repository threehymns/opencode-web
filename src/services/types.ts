// Define types that might not be exported or need adaptation
export interface Provider {
	id: string;
	name: string;
	env: string[];
	models: Record<string, Model>;
}

export interface Model {
	id: string;
	name: string;
	release_date: string;
	attachment: boolean;
	reasoning: boolean;
	temperature: boolean;
	tool_call: boolean;
	cost: {
		input: number;
		output: number;
		cache_read?: number;
		cache_write?: number;
	};
	limit: {
		context: number;
		output: number;
	};
}

export interface ProvidersResponse {
	providers: Provider[];
	default: Record<string, string>;
}

// Import SDK types
import type {
	AgentPartInput,
	FilePartInput,
	Project,
	Session,
	TextPartInput,
} from "@opencode-ai/sdk/client";

// Re-export SDK types for convenience
export type { Project, Session };

// Error Types
export interface AppError extends Error {
	code?: string;
	statusCode?: number;
	data?: unknown;
}

// Request Types (adapted for SDK)
export interface SendMessageRequest {
	model: { providerID: string; modelID: string };
	parts: (TextPartInput | FilePartInput | AgentPartInput)[];
	noReply?: boolean;
}

// Diff Types
export interface ChangedFile {
	file: string;
	added: number;
	removed: number;
}
