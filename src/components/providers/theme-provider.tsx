'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('gardensaas-theme') as Theme | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.classList.toggle('dark', stored === 'dark');
    } else {
      // Default to dark
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('gardensaas-theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  }, []);

  // Always render the same tree structure to avoid unmounting/remounting
  // children on hydration. The <html> element already carries className="dark"
  // from the server, so a wrapper <div className="dark"> is unnecessary and
  // was causing a full tree remount that broke framer-motion animations.
  return (
    <ThemeContext.Provider value={{ theme: mounted ? theme : 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
