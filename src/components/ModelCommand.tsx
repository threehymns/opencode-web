import { useEffect } from "react";
import { useModelStore } from "../stores/modelStore";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "./ui/button";

export function ModelCommand() {
	const { selectedModel, providers, setSelectedModel, fetchProviders } = useModelStore();

	useEffect(() => {
		fetchProviders();
	}, [fetchProviders]);

		const getSelectedModelName = (modelKey: string): string => {
		if (!providers) return modelKey;

		for (const provider of providers.providers) {
			const model = provider.models[modelKey];
			if (model) {
				return `${model.name}`;
			}
		}
		return modelKey;
	};

	return (
		<div className="flex items-center gap-1 text-xs text-muted-foreground">
			<Popover>
				<PopoverTrigger asChild>
					<Button variant="ghost" size="sm">
						{getSelectedModelName(selectedModel)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[400px] p-0">
					<Command>
						<CommandInput placeholder="Select model..." />
						<CommandList>
							<CommandEmpty>No models found.</CommandEmpty>
						{providers?.providers
							?.sort((a) => (a.id === 'opencode' ? -1 : 1))
							.map((provider) => (
								<CommandGroup key={provider.id} heading={provider.name}>
									{Object.entries(provider.models || {}).map(([modelId, model]) => (
										<CommandItem key={modelId} value={modelId} onSelect={() => setSelectedModel(modelId)}>
											{model.name}
										</CommandItem>
									))}
								</CommandGroup>
							))}
					</CommandList>
				</Command>
			</PopoverContent>
			</Popover>
		</div>
	);
}
