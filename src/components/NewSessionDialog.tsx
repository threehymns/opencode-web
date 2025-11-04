import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Project } from "@/services/types";
import { useSessionStore } from "@/stores/sessionStore";
import { ProjectSelector } from "./ProjectSelector";

interface NewSessionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function NewSessionDialog({
	open,
	onOpenChange,
}: NewSessionDialogProps) {
	const { createNewSession, isCreatingSession } = useSessionStore();

	const [title, setTitle] = useState("");
	const [selectedProject, setSelectedProject] = useState<Project | null>(null);
	const [showProjectSelector, setShowProjectSelector] = useState(false);

	const handleCreate = async () => {
		try {
			await createNewSession(title || undefined);
			setTitle("");
			setSelectedProject(null);
			onOpenChange(false);
		} catch (error) {
			console.error("Failed to create session:", error);
		}
	};

	const handleCancel = () => {
		setTitle("");
		setSelectedProject(null);
		onOpenChange(false);
	};

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Create New Session</DialogTitle>
						<DialogDescription>
							Start a new conversation session. You can optionally specify a
							title and select a project.
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<span className="text-right text-sm font-medium">Title</span>
							<Input
								id="title"
								placeholder="Optional session title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								className="col-span-3"
							/>
						</div>

						<div className="grid grid-cols-4 items-center gap-4">
							<span className="text-right text-sm font-medium">Project</span>
							<div className="col-span-3">
								<Button
									variant="outline"
									onClick={() => setShowProjectSelector(true)}
									className="w-full justify-start"
								>
									{selectedProject
										? selectedProject.worktree
										: "Select project (optional)"}
								</Button>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={handleCancel}
							disabled={isCreatingSession}
						>
							Cancel
						</Button>
						<Button onClick={handleCreate} disabled={isCreatingSession}>
							{isCreatingSession && (
								<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
							)}
							Create Session
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<ProjectSelector
				open={showProjectSelector}
				onOpenChange={setShowProjectSelector}
				onSelect={setSelectedProject}
			/>
		</>
	);
}
