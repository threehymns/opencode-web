// import { Avatar, AvatarFallback } from '../ui/avatar'
import type { Message, Part } from "@opencode-ai/sdk/client";
import { memo, useEffect, useRef } from "react";
import { useMessageStore } from "../../stores/messageStore";
import { ScrollArea } from "../ui/scroll-area";
import { MessagePartRenderer } from "./MessagePartRenderer";

interface MessageRendererProps {
	messageWithParts: { info: Message; parts: Part[] };
}

const MessageRenderer = memo(({ messageWithParts }: MessageRendererProps) => {
	const { info, parts } = messageWithParts;
	const isUser = info.role === "user";

	return (
		<div className="flex items-start gap-3 max-w-full">
			{/* <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback>
          {isUser ? 'U' : 'A'}
        </AvatarFallback>
      </Avatar> */}
			<div className="flex-1 min-w-0">
				<div
					className={`rounded-lg p-3 max-w-full space-y-3 ${
						isUser ? "bg-primary/10" : "bg-transparent"
					}`}
				>
					{parts.map((part) => (
						<MessagePartRenderer key={part.id} part={part} />
					))}
					{parts.length === 0 && (
						<div className="text-muted-foreground italic">Processing...</div>
					)}
				</div>
			</div>
		</div>
	);
});

MessageRenderer.displayName = "MessageRenderer";

interface ChatContainerProps {
	isLoadingSession?: boolean;
}

export const ChatContainer = ({
	isLoadingSession = false,
}: ChatContainerProps) => {
	const { messages } = useMessageStore();
	const scrollAreaRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		if (scrollAreaRef.current) {
			const scrollContainer = scrollAreaRef.current.querySelector(
				"[data-radix-scroll-area-viewport]",
			);
			if (scrollContainer) {
				scrollContainer.scrollTop = scrollContainer.scrollHeight;
			}
		}
	}, []);

	return (
		<ScrollArea ref={scrollAreaRef} className="h-[calc(100vh-280px)] mb-4 p-4">
			<div className="space-y-4">
				{isLoadingSession ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-muted-foreground">Loading session...</div>
					</div>
				) : messages.length === 0 ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-muted-foreground">
							No messages yet. Start a conversation!
						</div>
					</div>
				) : (
					messages.map((messageWithParts) => (
						<MessageRenderer
							key={messageWithParts.info.id}
							messageWithParts={messageWithParts}
						/>
					))
				)}
			</div>
		</ScrollArea>
	);
};
