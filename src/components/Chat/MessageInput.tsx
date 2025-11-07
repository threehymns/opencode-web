"use client";

import { Loader2Icon, SendIcon } from "lucide-react";
import {
	type ChangeEvent,
	type FormEvent,
	type KeyboardEventHandler,
	useCallback,
	useRef,
	useState,
} from "react";
import Textarea from "react-textarea-autosize";
import { ModelCommand } from "../ModelCommand";
import { Button } from "../ui/button";
import { MODE_LABELS } from "@/utils/constants";
import { Command, CommandItem, CommandList, CommandInput, CommandEmpty } from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface MessageInputProps {
	onSubmit: (message: string) => void;
	disabled: boolean;
	isLoading: boolean;
	isInitializing: boolean;
	selectedMode: string;
	onModeChange: (mode: string) => void;
}

export function MessageInput({
	onSubmit,
	disabled,
	isLoading,
	isInitializing,
	selectedMode,
	onModeChange,
}: MessageInputProps) {
	const inputRef = useRef<HTMLTextAreaElement | null>(null);
	const [input, setInput] = useState("");

	const handleSubmit = useCallback(
		(event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();

			const text = input.trim();
			if (!text || disabled || isLoading || isInitializing) return;

			// Clear input immediately
			setInput("");

			// Call onSubmit with the message
			onSubmit(text);
		},
		[input, disabled, isLoading, isInitializing, onSubmit],
	);

	const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
		if (e.key === "Enter") {
			if (e.shiftKey) {
				return;
			}
			e.preventDefault();
			e.currentTarget.form?.requestSubmit();
		}
	};

	const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
		setInput(e.target.value);
	};

	// Determine submit status
	const submitStatus = isLoading ? "loading" : "idle";

	let submitIcon: React.ReactNode = <SendIcon className="size-4" />;

	if (submitStatus === "loading") {
		submitIcon = <Loader2Icon className="size-4 animate-spin" />;
	}

	return (
		<form className="w-full" onSubmit={handleSubmit}>
			<div className="flex gap-2">
				{/* Text input */}
				<div className="flex-1 relative flex flex-col w-full rounded-xl border border-input bg-background p-1.5 text-sm ring-offset-background placeholder:text-muted-foreground ">
					<Textarea
						ref={inputRef}
						value={input}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						placeholder="Type your message..."
						disabled={disabled || isLoading || isInitializing}
						className="p-1 disabled:cursor-not-allowed disabled:opacity-50 resize-none focus-visible:outline-none w-full min-h-[60px]"
						rows={1}
					/>
					<div className="flex items-center justify-between pt-2">
						<div className="flex">
						<ModelCommand />
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="ghost" size="sm" className="text-muted-foreground">
									{selectedMode}
								</Button>
							</PopoverTrigger>
						<PopoverContent className="p-0 w-fit">
							<Command className="w-48">
								<CommandInput placeholder="Select mode..." />
								<CommandList>
									<CommandEmpty>No modes found.</CommandEmpty>
									{Object.entries(MODE_LABELS).map(([value, label]) => (
										<CommandItem key={value} value={value} onSelect={() => { 
											document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
											onModeChange(value);
										}}>
											{label}
										</CommandItem>
									))}
								</CommandList>
							</Command>
					</PopoverContent>
				</Popover>
						</div>
						{/* Submit button */}
						<Button
							type="submit"
							disabled={
								disabled || isLoading || isInitializing || !input.trim()
							}
							className="h-8 w-8 p-0"
							size="sm"
						>
							{submitIcon}
						</Button>
					</div>
				</div>
			</div>
		</form>
	);
}
