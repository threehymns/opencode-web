import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getCurrentProject, getProjects } from "../services/api";
import type { Project } from "../services/types";

interface ProjectState {
	projects: Project[];
	currentProject: Project | null;
	isLoadingProjects: boolean;
	isLoadingCurrent: boolean;
	error: string | null;

	// Actions
	fetchProjects: () => Promise<void>;
	fetchCurrentProject: () => Promise<void>;
	setCurrentProject: (project: Project) => void;
	clearError: () => void;
}

export const useProjectStore = create<ProjectState>()(
	persist(
		(set, get) => ({
			projects: [],
			currentProject: null,
			isLoadingProjects: false,
			isLoadingCurrent: false,
			error: null,

			fetchProjects: async () => {
				const { isLoadingProjects } = get();

				if (isLoadingProjects) {
					return;
				}

				set({ isLoadingProjects: true, error: null });

				try {
					const projects = await getProjects();
					set({ projects, isLoadingProjects: false });
				} catch (error) {
					const errorMessage =
						error instanceof Error ? error.message : "Unknown error";
					set({
						error: `Failed to load projects - ${errorMessage}`,
						isLoadingProjects: false,
					});
				}
			},

			fetchCurrentProject: async () => {
				const { isLoadingCurrent } = get();

				if (isLoadingCurrent) {
					return;
				}

				set({ isLoadingCurrent: true, error: null });

				try {
					const currentProject = await getCurrentProject();
					set({ currentProject, isLoadingCurrent: false });
				} catch (error) {
					const errorMessage =
						error instanceof Error ? error.message : "Unknown error";
					set({
						error: `Failed to load current project - ${errorMessage}`,
						isLoadingCurrent: false,
					});
				}
			},

			setCurrentProject: (project: Project) => {
				set({ currentProject: project });
			},

			clearError: () => {
				set({ error: null });
			},
		}),
		{
			name: "opencode-project-state",
			partialize: (state) => ({
				currentProject: state.currentProject,
			}),
		},
	),
);
