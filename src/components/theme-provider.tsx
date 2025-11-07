import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
	children: React.ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
};

type ThemeProviderState = {
	theme: Theme;
	resolvedTheme: 'light' | 'dark';
	setTheme: (theme: Theme) => void;
};

const getResolvedTheme = (currentTheme: Theme = 'system') => 
  currentTheme === 'system' 
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : currentTheme;

const initialState: ThemeProviderState = {
	theme: "system",
	resolvedTheme: getResolvedTheme('system'),
	setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
	children,
	defaultTheme = "system",
	storageKey = "vite-ui-theme",
	...props
}: ThemeProviderProps) {
	const [theme, setTheme] = useState<Theme>(
  () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
);

const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(getResolvedTheme);

useEffect(() => {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");

  const updateTheme = () => {
    const newResolvedTheme = theme === "system" ? getResolvedTheme() : theme;
    root.classList.add(newResolvedTheme);
    setResolvedTheme(newResolvedTheme);
  };

  updateTheme();

  // Listen for system theme changes
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = () => {
    if (theme === "system") {
      updateTheme();
    }
  };

  mediaQuery.addEventListener("change", handleChange);
  return () => mediaQuery.removeEventListener("change", handleChange);
}, [theme]);

const value = {
  theme,
  resolvedTheme,
  setTheme: (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setTheme(newTheme);
  },
	};

	return (
		<ThemeProviderContext.Provider {...props} value={value}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export const useTheme = () => {
	const context = useContext(ThemeProviderContext);

	if (context === undefined)
		throw new Error("useTheme must be used within a ThemeProvider");

	return context;
};
