import { useTheme } from '@/contexts/ThemeContext';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

export default function ThemeToggle({ className = '' }) {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={
                isDark ? 'Switch to light mode' : 'Switch to dark mode'
            }
            className={
                'rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 ' +
                className
            }
        >
            {isDark ? (
                <SunIcon className="h-5 w-5" aria-hidden />
            ) : (
                <MoonIcon className="h-5 w-5" aria-hidden />
            )}
        </button>
    );
}
