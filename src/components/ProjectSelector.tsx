import { useEffect, useState } from "react";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import type { Project } from "@/services/types";
import { useProjectStore } from "@/stores/projectStore";

interface ProjectSelectorProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSelect: (project: Project) => void;
}

export function ProjectSelector({
	open,
	onOpenChange,
	onSelect,
}: ProjectSelectorProps) {
	const { projects, fetchProjects, isLoadingProjects, error } =
		useProjectStore();
	const [searchValue, setSearchValue] = useState("");

	useEffect(() => {
		if (open && projects.length === 0 && !isLoadingProjects) {
			fetchProjects();
		}
	}, [open, projects.length, fetchProjects, isLoadingProjects]);

	const filteredProjects = projects.filter((project) =>
		project.worktree.toLowerCase().includes(searchValue.toLowerCase()),
	);

	const handleSelect = (project: Project) => {
		onSelect(project);
		onOpenChange(false);
		setSearchValue("");
	};

	return (
		<CommandDialog open={open} onOpenChange={onOpenChange}>
			<CommandInput
				placeholder="Search projects..."
				value={searchValue}
				onValueChange={setSearchValue}
			/>
			<CommandList>
				{error && (
					<div className="p-4 text-sm text-destructive">
						Error loading projects: {error}
					</div>
				)}
				<CommandEmpty>
					{isLoadingProjects
						? "Loading projects..."
						: error
							? "Failed to load projects"
							: "No projects found."}
				</CommandEmpty>
				{!isLoadingProjects && !error && (
					<CommandGroup heading="Projects">
						{filteredProjects.map((project) => (
							<CommandItem
								key={project.id}
								value={project.worktree}
								onSelect={() => handleSelect(project)}
							>
								<div className="flex flex-col">
									<span className="font-medium">{project.worktree}</span>
									<span className="text-sm text-muted-foreground">
										Created:{" "}
										{new Date(project.time.created).toLocaleDateString()}
									</span>
								</div>
							</CommandItem>
						))}
					</CommandGroup>
				)}
			</CommandList>
		</CommandDialog>
	);
}
