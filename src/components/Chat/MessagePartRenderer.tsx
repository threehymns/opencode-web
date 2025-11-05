import type { Part, ToolState } from "@opencode-ai/sdk/client";
import {
	CheckCircleIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	CircleIcon,
	ClockIcon,
	Loader2Icon,
	XCircleIcon,
} from "lucide-react";
import type React from "react";
import { memo, useCallback, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
	oneDark,
	oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
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
				console.warn("Failed to parse todo output:", e);
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
											{(state as any).attachments.map(
												(attachment: any, index: number) => (
													<div
														key={index}
														className="text-xs bg-accent p-2 rounded"
													>
														📎 {attachment.filename || "File"} (
														{attachment.mime})
													</div>
												),
											)}
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

const MessagePartRendererComponent: React.FC<MessagePartRendererProps> = ({
	part,
}) => {
	const { theme } = useTheme();

	const syntaxStyle = useMemo(
		() => (theme === "dark" ? oneDark : oneLight),
		[theme],
	);

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
				const match = /language-(\w+)/.exec(className || "");
				return !inline && match ? (
					<SyntaxHighlighter
						style={syntaxStyle}
						language={match[1]}
						PreTag="div"
						{...props}
					>
						{String(children).replace(/\n$/, "")}
					</SyntaxHighlighter>
				) : (
					<code
						className={`bg-muted px-1.5 py-0.5 rounded text-sm font-mono ${className}`}
						{...props}
					>
						{children}
					</code>
				);
			},
		}),
		[syntaxStyle],
	);

	switch (part.type) {
		case "text":
			return (
				<div className="prose prose-sm max-w-none dark:prose-invert">
					<ReactMarkdown components={markdownComponents}>
						{(part as any).text}
					</ReactMarkdown>
				</div>
			);

		case "reasoning":
			return (
				<div className="border-l-4 border-primary pl-4 py-2 bg-accent rounded">
					<div className="text-sm text-accent-foreground font-medium mb-1">
						Reasoning
					</div>
					<div className="text-sm text-accent-foreground/80 whitespace-pre-wrap">
						{(part as any).text}
					</div>
				</div>
			);

		case "tool": {
			const toolName = (part as any).tool;
			return (
				<div className="space-y-2">
					{toolName === "todowrite" ? (
						<TodoRenderer state={(part as any).state} />
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
		JSON.stringify((prev as any).state) !== JSON.stringify((next as any).state)
	)
		return false;
	// For other types, assume they don't change content often
	return true;
};

export const MessagePartRenderer = memo(MessagePartRendererComponent, areEqual);
