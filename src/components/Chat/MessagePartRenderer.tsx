import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { python } from "@codemirror/lang-python";
import { MergeView, unifiedMergeView } from "@codemirror/merge";
import { EditorState } from "@codemirror/state";
import { lineNumbers } from "@codemirror/view";
import type { Part, ToolState } from "@opencode-ai/sdk/client";
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import { EditorView } from "codemirror";
import {
	CheckCircleIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	CircleIcon,
	ClockIcon,
	CodeIcon,
	Edit3,
	LightbulbIcon,
	Loader2Icon,
	XCircleIcon,
} from "lucide-react";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { logger } from "@/lib/logger";
import ReactMarkdown from "react-markdown";
import { CopyButton } from "../copy-button";
import { useTheme } from "../theme-provider";

interface TodoItem {
	content: string;
	status: "pending" | "in_progress" | "completed" | "cancelled";
	priority: "high" | "medium" | "low";
	id: string;
}

interface MessagePartRendererProps {
	part: Part;
}

// Function to detect language from file path
const getLanguageExtension = (filePath: string) => {
	const extension = filePath.split(".").pop()?.toLowerCase();
	switch (extension) {
		case "js":
		case "jsx":
			return javascript({ jsx: true });
		case "ts":
		case "tsx":
			return javascript({ typescript: true, jsx: true });
		case "py":
			return python();
		case "json":
			return json();
		case "css":
			return css();
		case "html":
			return html();
		case "md":
			return markdown();
		default:
			return null;
	}
};

const EditRenderer: React.FC<{ state: ToolState; theme: string }> = memo(
	({ state, theme }) => {
		const diffRef = useRef<HTMLDivElement>(null);
		const [isDiffExpanded, setIsDiffExpanded] = useState(false);

		useEffect(() => {
			const metadata = (state as any).metadata;
			if (
				!isDiffExpanded ||
				!diffRef.current ||
				!metadata?.filediff?.before ||
				!metadata?.filediff?.after ||
				state.status !== "completed"
			) {
				return;
			}

			let view: EditorView | MergeView | null = null;
			const container = diffRef.current;
			const filePath = (state as any).input?.filePath || "";
			const languageExtension = getLanguageExtension(filePath);

			const sharedExtensions = [
				theme === "dark" ? vscodeDark : vscodeLight,
				lineNumbers(),
				EditorView.lineWrapping,
				EditorView.editable.of(false),
				EditorState.readOnly.of(true),
				EditorView.theme({
					".cm-content": { backgroundColor: "var(--card)" },
					".cm-gutter": { backgroundColor: "var(--muted)" },
					".cm-gutters.cm-gutters-before": { borderColor: "var(--border)" },
					".cm-lineWrapping": { wordBreak: "break-all" },
				}),
			];

			if (languageExtension) {
				sharedExtensions.push(languageExtension);
			}

			try {
				if (container.offsetWidth >= 640) {
					// Side-by-side for larger screens

					view = new MergeView({
						a: {
							doc: metadata.filediff.before,
							extensions: sharedExtensions,
						},
						b: {
							doc: metadata.filediff.after,
							extensions: sharedExtensions,
						},
						parent: container,
						collapseUnchanged: { margin: 3, minSize: 2 },
					});
				} else {
					// Unified for smaller screens
					view = new EditorView({
						parent: container,
						doc: metadata.filediff.after,
						extensions: [
							...sharedExtensions,
							EditorView.lineWrapping,
							unifiedMergeView({
								original: metadata.filediff.before,
								mergeControls: false,
								collapseUnchanged: { margin: 3, minSize: 2 },
							}),
						],
					});
				}

				// Force a resize event to ensure proper rendering
				setTimeout(() => {
					if (view) {
						const event = new Event("resize");
						window.dispatchEvent(event);
					}
				}, 0);
			} catch (error) {
				logger.error("Error initializing diff view", error);
			}

			return () => {
				if (view) {
					try {
						view.destroy();
					} catch (e) {
						logger.error("Error cleaning up diff view", e);
					}
				}
			};
		}, [state, theme, isDiffExpanded]);

		const renderStateContent = () => {
			switch (state.status) {
				case "pending":
					return (
						<div className="flex items-center gap-2 text-muted-foreground">
							<ClockIcon className="h-4 w-4" />
							<span className="text-sm">Preparing edit...</span>
						</div>
					);

				case "running":
					return (
						<div className="flex items-center gap-2 text-primary">
							<Loader2Icon className="h-4 w-4 animate-spin" />
							<div className="flex-1">
								<div className="text-sm font-medium">
									{(state as any).title || "Applying edit"}
								</div>
							</div>
						</div>
					);

				case "completed": {
					const output = (state as any).output;
					if (output && typeof output === "object") {
					if (output.diagnostics) {
						logger.debug("Edit tool diagnostics", output.diagnostics);
					}
					if (output.filediff) {
						logger.debug("Edit tool filediff", output.filediff);
					}
					}
					return (
						<button
							className="space-y-2 w-full items-center"
							type="button"
							onClick={() => setIsDiffExpanded(!isDiffExpanded)}
						>
							<div className="flex items-center justify-between text-primary">
								<div className="flex items-center gap-2">
									<Edit3 className="h-4 w-4" />
									<span className="text-sm font-medium">
										Edited {(() => {
											const path = (state as any).input.filePath;
											const lastSlashIndex = path.lastIndexOf("/");
											if (lastSlashIndex === -1) return path;
											return (
												<>
													<span className="text-muted-foreground truncate">
														{path.substring(0, lastSlashIndex + 1)}
													</span>
													{path.substring(lastSlashIndex + 1)}
												</>
											);
										})()}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-xs text-green-500">
										+{(state as any).metadata.filediff?.additions}
									</span>
									<span className="text-xs text-red-500">
										-{(state as any).metadata.filediff?.deletions}
									</span>
									{isDiffExpanded ? (
										<ChevronDownIcon className="h-3 w-3" />
									) : (
										<ChevronRightIcon className="h-3 w-3" />
									)}
								</div>
							</div>
							{isDiffExpanded && (
								<div
									ref={diffRef}
									className="mt-2 w-full text-sm text-start"
								></div>
							)}
						</button>
					);
				}

				case "error":
					return (
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-destructive">
								<XCircleIcon className="h-4 w-4" />
								<span className="text-sm font-medium">Edit failed</span>
							</div>
							<div className="bg-destructive/10 rounded p-3 border-l-4 border-destructive">
								<pre className="text-xs whitespace-pre-wrap font-mono text-destructive">
									{(state as any).error}
								</pre>
							</div>
						</div>
					);

				default:
					return (
						<div className="text-sm text-muted-foreground">Unknown state</div>
					);
			}
		};

		return (
			<div className="border rounded-lg p-3 bg-card flex items-center">
				{renderStateContent()}
			</div>
		);
	},
);

const TodoRenderer: React.FC<{ state: ToolState }> = memo(({ state }) => {
	const getStatusIcon = useCallback((status: TodoItem["status"]) => {
		switch (status) {
			case "completed":
				return <CheckCircleIcon className="h-4 w-4 text-primary" />;
			case "in_progress":
				return <Loader2Icon className="h-4 w-4 text-primary animate-spin" />;
			case "cancelled":
				return <XCircleIcon className="h-4 w-4 text-destructive" />;
			default:
				return <CircleIcon className="h-4 w-4 text-muted-foreground" />;
		}
	}, []);

	const getPriorityColor = useCallback((priority: TodoItem["priority"]) => {
		switch (priority) {
			case "high":
				return "text-destructive";
			case "medium":
				return "text-primary";
			default:
				return "text-muted-foreground";
		}
	}, []);

	const parsedTodos = useMemo(() => {
		let todos: TodoItem[] = [];
		const output = (state as any).output;
		if (Array.isArray(output)) {
			todos = output as TodoItem[];
		} else if (typeof output === "string") {
			try {
				const parsed = JSON.parse(output);
				if (Array.isArray(parsed)) {
					todos = parsed as TodoItem[];
				} else if (parsed && Array.isArray(parsed.todos)) {
					todos = parsed.todos;
				}
				} catch (e) {
					logger.warn("Failed to parse todo output", e);
				}
			} else if (
			output &&
			typeof output === "object" &&
			Array.isArray((output as any).todos)
		) {
			todos = (output as any).todos;
		}
		return todos;
	}, [state]);

	const renderStateContent = () => {
		switch (state.status) {
			case "pending":
				return (
					<div className="flex items-center gap-2 text-muted-foreground">
						<ClockIcon className="h-4 w-4" />
						<span className="text-sm">Creating todo list...</span>
					</div>
				);

			case "running":
				return (
					<div className="flex items-center gap-2 text-primary">
						<Loader2Icon className="h-4 w-4 animate-spin" />
						<div className="flex-1">
							<div className="text-sm font-medium">
								{(state as any).title || "Creating todo list"}
							</div>
						</div>
					</div>
				);

			case "completed": {
				return (
					<div className="space-y-3">
						<div className="flex items-center gap-2 text-primary">
							<CheckCircleIcon className="h-4 w-4" />
							<span className="text-sm font-medium">Todo List Created</span>
						</div>
						{parsedTodos.length > 0 ? (
							<div className="space-y-2">
								{parsedTodos.map((todo: TodoItem) => (
									<div
										key={todo.id}
										className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border"
									>
										<div className="flex-shrink-0 mt-0.5">
											{getStatusIcon(todo.status)}
										</div>
										<div className="flex-1 min-w-0">
											<div className="text-sm font-medium text-foreground">
												{todo.content}
											</div>
											<div className="flex items-center gap-2 mt-1">
												<span
													className={`text-xs font-medium ${getPriorityColor(todo.priority)}`}
												>
													{todo.priority.toUpperCase()}
												</span>
												<span className="text-xs text-muted-foreground">
													{todo.status.replace("_", " ").toUpperCase()}
												</span>
											</div>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-sm text-muted-foreground">
								No todos found in the output.
							</div>
						)}
					</div>
				);
			}

			case "error":
				return (
					<div className="space-y-2">
						<div className="flex items-center gap-2 text-destructive">
							<XCircleIcon className="h-4 w-4" />
							<span className="text-sm font-medium">
								Failed to create todo list
							</span>
						</div>
						<div className="bg-destructive/10 rounded p-3 border-l-4 border-destructive">
							<pre className="text-xs whitespace-pre-wrap font-mono text-destructive">
								{(state as any).error}
							</pre>
						</div>
					</div>
				);

			default:
				return (
					<div className="text-sm text-muted-foreground">Unknown state</div>
				);
		}
	};

	return (
		<div className="border rounded-lg p-3 bg-card">{renderStateContent()}</div>
	);
});

const ToolStateRenderer: React.FC<{ state: ToolState }> = memo(({ state }) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const renderStateContent = () => {
		switch (state.status) {
			case "pending":
				return (
					<div className="flex items-center gap-2 text-muted-foreground">
						<ClockIcon className="h-4 w-4" />
						<span className="text-sm">Pending execution</span>
					</div>
				);

			case "running":
				return (
					<div className="flex items-center gap-2 text-primary">
						<Loader2Icon className="h-4 w-4 animate-spin" />
						<div className="flex-1">
							<div className="text-sm font-medium">
								{(state as any).title || "Running tool"}
							</div>
							{(state as any).metadata && (
								<div className="text-xs text-muted-foreground mt-1">
									{Object.entries((state as any).metadata).map(
										([key, value]) => (
											<div key={key}>
												{key}: {String(value)}
											</div>
										),
									)}
								</div>
							)}
						</div>
					</div>
				);

			case "completed":
				return (
					<div className="space-y-2">
						<div className="flex items-center gap-2 text-primary">
							<CheckCircleIcon className="h-4 w-4" />
							<span className="text-sm font-medium">
								{(state as any).title}
							</span>
							{((state as any).output ||
								((state as any).attachments &&
									(state as any).attachments.length > 0)) && (
								<button
									type="button"
									onClick={() => setIsExpanded(!isExpanded)}
									className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
								>
									{isExpanded ? (
										<ChevronDownIcon className="h-4 w-4" />
									) : (
										<ChevronRightIcon className="h-4 w-4" />
									)}
								</button>
							)}
						</div>
						{isExpanded && (
							<div className="space-y-2">
								{(state as any).output && (
									<div className="bg-muted rounded p-3 border-l-4 border-primary">
										<pre className="text-xs whitespace-pre-wrap font-mono">
											{(state as any).output}
										</pre>
									</div>
								)}
								{(state as any).attachments &&
									(state as any).attachments.length > 0 && (
										<div className="space-y-1">
											<div className="text-xs text-muted-foreground">
												Attachments:
											</div>
											{(state as any).attachments.map((attachment: any) => (
												<div
													key={attachment.filename || attachment.mime}
													className="text-xs bg-accent p-2 rounded"
												>
													📎 {attachment.filename || "File"} ({attachment.mime})
												</div>
											))}
										</div>
									)}
							</div>
						)}
					</div>
				);

			case "error":
				return (
					<div className="space-y-2">
						<div className="flex items-center gap-2 text-destructive">
							<XCircleIcon className="h-4 w-4" />
							<span className="text-sm font-medium">Tool execution failed</span>
							<button
								type="button"
								onClick={() => setIsExpanded(!isExpanded)}
								className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
							>
								{isExpanded ? (
									<ChevronDownIcon className="h-4 w-4" />
								) : (
									<ChevronRightIcon className="h-4 w-4" />
								)}
							</button>
						</div>
						{isExpanded && (
							<div className="bg-destructive/10 rounded p-3 border-l-4 border-destructive">
								<pre className="text-xs whitespace-pre-wrap font-mono text-destructive">
									{(state as any).error}
								</pre>
							</div>
						)}
					</div>
				);

			default:
				return (
					<div className="text-sm text-muted-foreground">Unknown state</div>
				);
		}
	};

	return (
		<div className="border rounded-lg p-3 bg-card">{renderStateContent()}</div>
	);
});

const getLanguageExtensionByName = (language: string | undefined) => {
	if (!language) {
		return undefined;
	}
	const normalized = language.toLowerCase();
	switch (normalized) {
		case "js":
		case "jsx":
		case "javascript":
			return javascript({ jsx: true });
		case "ts":
		case "tsx":
		case "typescript":
			return javascript({ typescript: true, jsx: true });
		case "py":
		case "python":
			return python();
		case "json":
			return json();
		case "css":
			return css();
		case "html":
			return html();
		case "md":
		case "markdown":
			return markdown();
		default:
			return undefined;
	}
};

const MessagePartRendererComponent: React.FC<MessagePartRendererProps> = ({
	part,
}) => {
	const { resolvedTheme } = useTheme();

	const markdownComponents = useMemo(
		() => ({
			code({
				inline,
				className,
				children,
				...props
			}: {
				inline?: boolean;
				className?: string;
				children?: React.ReactNode;
			}) {
				const match = /language-([\w-]+)/.exec(className || "");
				const language = match?.[1];

				if (!inline && language) {
					const langExtension = getLanguageExtensionByName(language);

					const codeText =
						typeof children === "string"
							? children
							: Array.isArray(children)
								? children.join("")
								: String(children ?? "");

					const extensions = [
						resolvedTheme === "dark" ? vscodeDark : vscodeLight,
						lineNumbers(),
						EditorView.lineWrapping,
						EditorView.editable.of(false),
						EditorState.readOnly.of(true),
						EditorView.theme(
							{
								".cm-editor": {
									backgroundColor: "var(--card)",
									borderRadius: "0.375rem",
								},
								".cm-content": {
									backgroundColor: "var(--card)",
								},
								".cm-scroller": {
									fontFamily:
										'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
								},
								".cm-gutters": {
									backgroundColor: "var(--muted)",
									borderRight: "1px solid var(--border)",
									color: "var(--muted-foreground)",
								},
							},
							{ dark: resolvedTheme === "dark" },
						),
						...(langExtension ? [langExtension] : []),
					];

					const state = EditorState.create({
						doc: codeText.replace(/\n$/, ""),
						extensions,
					});

					const attachRef = (node: HTMLDivElement | null) => {
						if (!node) return;
						while (node.firstChild) {
							node.removeChild(node.firstChild);
						}
						new EditorView({
							state,
							parent: node,
						});
					};

					return (
						<div className="mt-2 overflow-clip rounded-md border bg-card max-w-prose">
							<header className="sticky top-0 z-10 flex items-center justify-between gap-2 p-1 bg-background/90 backdrop-blur border-b border-border/50">
								<div className="ml-1 flex items-center gap-2 text-sm font-medium text-muted-foreground">
									<CodeIcon className="h-4 w-4" />
									{language}
								</div>
								<CopyButton value={codeText} />
							</header>
							<div ref={attachRef} />
						</div>
					);
				}

				return (
					<code
						className={`bg-muted px-1.5 py-0.5 rounded text-sm font-mono ${className ?? ""}`}
						{...props}
					>
						{children}
					</code>
				);
			},
		}),
		[resolvedTheme],
	);

	switch (part.type) {
		case "text":
			return (
				<div className="prose prose-sm max-w-prose dark:prose-invert">
					<ReactMarkdown
						components={{
							...markdownComponents,
							// Prevent ReactMarkdown from wrapping our custom code block in an extra pre
							pre({ children }) {
								return <>{children}</>;
							},
						}}
					>
						{(part as any).text}
					</ReactMarkdown>
				</div>
			);

		case "reasoning":
			return (
				<div className="border-l-2 border-accent pl-4 relative prose max-w-prose prose-p:text-muted-foreground dark:prose-invert prose-sm">
					<div className="text-sm text-accent-foreground font-medium">
						<LightbulbIcon className="bg-background h-8 w-8 p-2 absolute -top-2 -left-4" />{" "}
						Thought for{" "}
						{part.time.end &&
							((part.time.end - part.time.start) / 1000).toFixed(1)}{" "}
						seconds
					</div>
					<ReactMarkdown
						components={{
							...markdownComponents,
							// Prevent ReactMarkdown from wrapping our custom code block in an extra pre
							pre({ children }) {
								return <>{children}</>;
							},
						}}
					>
						{(part as any).text}
					</ReactMarkdown>
				</div>
			);

		case "tool": {
			const toolName = (part as any).tool;
			return (
				<div className="space-y-2">
					{toolName === "todowrite" ? (
						<TodoRenderer state={(part as any).state} />
					) : toolName === "edit" ? (
						<EditRenderer state={(part as any).state} theme={resolvedTheme} />
					) : (
						<>
							<div className="text-sm font-medium text-muted-foreground">
								Tool: {toolName}
							</div>
							<ToolStateRenderer state={(part as any).state} />
						</>
					)}
				</div>
			);
		}

		case "file":
			return (
				<div className="border rounded p-3 bg-muted">
					<div className="flex items-center gap-2">
						<div className="text-sm font-medium">
							📎 {(part as any).filename || "File"}
						</div>
						<div className="text-xs text-muted-foreground">
							({(part as any).mime})
						</div>
					</div>
					{(part as any).source && (
						<div className="mt-2 text-xs text-muted-foreground">
							From: {(part as any).source.path}
						</div>
					)}
				</div>
			);

		case "step-start":
			return null;

		case "step-finish":
			return null;

		case "agent":
			return (
				<div className="flex items-center gap-2 text-secondary border-l-4 border-secondary pl-4 py-1">
					<div className="text-sm font-medium">
						🤖 Agent: {(part as any).name}
					</div>
				</div>
			);

		case "retry":
			return (
				<div className="flex items-center gap-2 text-accent border-l-4 border-accent pl-4 py-1">
					<div className="text-sm">
						🔄 Retry attempt {(part as any).attempt}
					</div>
				</div>
			);

		case "patch":
			return (
				// <div className="border rounded-lg p-3 bg-card">
				// 	<div className="flex items-center gap-2 text-primary mb-2">
				// 		<div className="text-sm font-medium">Patch Applied</div>
				// 	</div>
				// 	<div className="space-y-1">
				// 		<div className="text-xs text-muted-foreground">
				// 			Hash: {(part as any).hash}
				// 		</div>
				// 		<div className="text-xs text-muted-foreground">
				// 			Files: {(part as any).files.join(", ")}
				// 		</div>
				// 	</div>
				// </div>
				null
			);

		default:
			return (
				<div className="text-sm text-muted-foreground border rounded p-2">
					Unknown part type: {part.type}
				</div>
			);
	}
};

const areEqual = (
	prevProps: MessagePartRendererProps,
	nextProps: MessagePartRendererProps,
) => {
	const prev = prevProps.part;
	const next = nextProps.part;
	if (prev.id !== next.id || prev.type !== next.type) return false;
	if (prev.type === "text" && (prev as any).text !== (next as any).text)
		return false;
	if (
		prev.type === "tool" &&
		(prev as any).state?.status !== (next as any).state?.status
	)
		return false;
	// For other types, assume they don't change content often
	return true;
};

export const MessagePartRenderer = memo(MessagePartRendererComponent, areEqual);
