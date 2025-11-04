import { useModelStore } from "../stores/modelStore";

export function ModelCommand() {
	const { selectedModel } = useModelStore();

	return (
		<div className="flex items-center gap-1 text-xs text-muted-foreground">
			<span>{selectedModel || "No model selected"}</span>
		</div>
	);
}
