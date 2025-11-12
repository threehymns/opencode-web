import { createOpencodeClient } from "@opencode-ai/sdk";
import type {
  AssistantMessage,
  Message,
  Part,
  Project,
  Session,
} from "@opencode-ai/sdk/client";
import type {
  AppError,
  ProvidersResponse,
  SendMessageRequest,
  ChangedFile,
} from "./types";

// SDK client instance
let client: Awaited<ReturnType<typeof createOpencodeClient>> | null = null;

// Initialize SDK client
const initializeClient = async () => {
  if (!client) {
    client = createOpencodeClient({
      baseUrl: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:4096",
    });
  }
  return client;
};

// Convert SDK errors to AppError format
const createAppError = (error: unknown): AppError => {
  const isErrorLike = (
    err: unknown,
  ): err is { message?: string; status?: number; code?: string } => {
    return typeof err === "object" && err !== null;
  };

  const message =
    isErrorLike(error) && error.message ? error.message : "Unknown error";
  const appError = new Error(message) as AppError;
  appError.statusCode = isErrorLike(error) && error.status ? error.status : 500;
  appError.code = isErrorLike(error) && error.code ? error.code : undefined;
  appError.data = error;
  return appError;
};

// Session Management
export const createSession = async (title?: string): Promise<Session> => {
  try {
    const sdkClient = await initializeClient();
    const result = await sdkClient.session.create({
      body: title ? { title } : {},
    });
    if (result.error) throw result.error;
    if (!result.data) throw new Error("No session data returned");
    return result.data;
  } catch (error) {
    throw createAppError(error);
  }
};

export const updateSessionTitle = async (
  sessionId: string,
  title: string,
): Promise<Session> => {
  try {
    const sdkClient = await initializeClient();
    const result = await sdkClient.session.update({
      path: { id: sessionId },
      body: { title },
    });
    if (result.error) throw result.error;
    if (!result.data) throw new Error("No session data returned");
    return result.data;
  } catch (error) {
    throw createAppError(error);
  }
};

export const listSessions = async (): Promise<Session[]> => {
  try {
    const sdkClient = await initializeClient();
    const result = await sdkClient.session.list();
    if (result.error) throw result.error;
    return result.data || [];
  } catch (error) {
    throw createAppError(error);
  }
};

export const deleteSession = async (sessionId: string): Promise<boolean> => {
  try {
    const sdkClient = await initializeClient();
    const result = await sdkClient.session.delete({ path: { id: sessionId } });
    if (result.error) throw result.error;
    return result.data || false;
  } catch (error) {
    throw createAppError(error);
  }
};

// Project Management
export const getProjects = async (): Promise<Project[]> => {
  try {
    const sdkClient = await initializeClient();
    const result = await sdkClient.project.list();
    if (result.error) throw result.error;
    return result.data || [];
  } catch (error) {
    throw createAppError(error);
  }
};

export const getCurrentProject = async (): Promise<Project> => {
  try {
    const sdkClient = await initializeClient();
    const result = await sdkClient.project.current();
    if (result.error) throw result.error;
    if (!result.data) throw new Error("No current project data returned");
    return result.data;
  } catch (error) {
    throw createAppError(error);
  }
};

// Provider and Model Management
export const getProviders = async (): Promise<ProvidersResponse> => {
  try {
    const sdkClient = await initializeClient();
    const result = await sdkClient.config.providers();
    if (result.error) throw result.error;
    if (!result.data) throw new Error("No providers data returned");
    return result.data;
  } catch (error) {
    throw createAppError(error);
  }
};

// Message Management
export const sendMessage = async (
  sessionId: string,
  request: SendMessageRequest,
): Promise<{ info: AssistantMessage; parts: Part[] }> => {
  try {
    const sdkClient = await initializeClient();
    const result = await sdkClient.session.prompt({
      path: { id: sessionId },
      body: request,
    });
    if (result.error) throw result.error;
    if (!result.data) throw new Error("No message data returned");

    // SDK returns { info: AssistantMessage, parts: Part[] }
    return result.data;
  } catch (error) {
    throw createAppError(error);
  }
};

export const getSessionMessages = async (
  sessionId: string,
): Promise<Array<{ info: Message; parts: Part[] }>> => {
  try {
    const sdkClient = await initializeClient();
    const result = await sdkClient.session.messages({
      path: { id: sessionId },
    });
    if (result.error) throw result.error;
    return result.data || [];
  } catch (error) {
    throw createAppError(error);
  }
};

export const getSessionDiff = async (
  sessionId: string,
): Promise<ChangedFile[]> => {
  try {
    const sdkClient = await initializeClient();
    const result = await sdkClient.session.diff({
      path: { id: sessionId },
    });
    if (result.error) throw result.error;
    const diffData = result.data || [];
    // Map FileDiff to ChangedFile
    return diffData.map((item: any) => ({
      file: item.file,
      added: item.added || item.additions || 0,
      removed: item.removed || item.deletions || 0,
    }));
  } catch (error) {
    throw createAppError(error);
  }
};

// App Management - Simplified since SDK doesn't have these methods
export const getAppInfo = async (): Promise<Record<string, unknown>> => {
  // SDK doesn't have app.info, return empty object for now
  return {};
};

export const initializeApp = async (): Promise<boolean> => {
  // SDK doesn't have app.init, return true for now
  return true;
};

export const getConfig = async (): Promise<Record<string, unknown>> => {
  try {
    const sdkClient = await initializeClient();
    const result = await sdkClient.config.get();
    if (result.error) throw result.error;
    return result.data || {};
  } catch (error) {
    throw createAppError(error);
  }
};

// Get SDK client for direct access (e.g., for event subscription)
export const getSDKClient = async () => {
  return await initializeClient();
};

// Default export with all API functions
export const api = {
  // Projects
  getProjects,
  getCurrentProject,

  // Session
  createSession,
  listSessions,
  deleteSession,

  // Providers
  getProviders,

  // Messages
  sendMessage,
  getSessionMessages,
  getSessionDiff,

  // App
  getAppInfo,
  initializeApp,
  getConfig,

  // SDK client access
  getSDKClient,
};

export default api;
