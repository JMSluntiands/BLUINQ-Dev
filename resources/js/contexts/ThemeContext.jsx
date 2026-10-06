import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'bluinq-theme';

// The production build can copy this module into more than one chunk.
// Keep a single context object so ThemeProvider and useTheme stay connected.
const ThemeContext =
    globalThis.__bluinqThemeContext ??
    (globalThis.__bluinqThemeContext = createContext(null));

function readStoredTheme() {
    if (typeof window === 'undefined') {
        return 'light';
    }

    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(readStoredTheme);

    useEffect(() => {
        const root = document.documentElement;

        localStorage.setItem(STORAGE_KEY, theme);

        if (theme === 'dark') {
            root.classList.add('dark');
            return;
        }

        root.classList.remove('dark');
    }, [theme]);

    const toggleTheme = () => {
        setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
    };

    return (
        <ThemeContext.Provider
            value={{
                theme,
                isDark: theme === 'dark',
                setTheme,
                toggleTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }

    return context;
}
