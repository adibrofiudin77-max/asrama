import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <button onClick={() => setTheme(dark ? "light" : "dark")} data-testid="theme-toggle-btn" aria-label={dark ? "Mode Terang" : "Mode Gelap"}
      className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-amber-50 hover:text-emerald-900 transition-colors">
      {dark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
      <span className="hidden sm:inline">{dark ? "Mode Terang" : "Mode Gelap"}</span>
    </button>
  );
}
