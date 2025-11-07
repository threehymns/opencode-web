import { useModelStore } from "../stores/modelStore";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "./ui/command";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "./ui/button";

export function ModelCommand() {
	const { selectedModel, providers } = useModelStore();

	return (
		<div className="flex items-center gap-1 text-xs text-muted-foreground">
			{/* <Popover> */}
				{/* <PopoverTrigger asChild> */}
					<Button variant="outline" size="sm" className="h-8 w-8 p-0">
					</Button>
				{/* </PopoverTrigger> */}
				{/* <PopoverContent className="w-[400px] p-0"> */}
					<Command>
						<CommandInput placeholder="Select model..." />
						<CommandList>
							<CommandEmpty>No models found.</CommandEmpty>
						{providers?.providers
							?.sort((a) => (a.id === 'opencode' ? -1 : 1))
							.map((provider) => (
								<CommandGroup key={provider.id} heading={provider.name}>
									{Object.entries(provider.models || {}).map(([modelId, model]) => (
										<CommandItem key={modelId} value={modelId}>
											{model.name}
										</CommandItem>
									))}
								</CommandGroup>
							))}
					</CommandList>
				</Command>
			{/* </Popover> */}
		</div>
	);
}
