import { useCallback, useEffect, useState } from 'react';
import type { Theme } from '../lib/heat';

const STORAGE_KEY = 'rpg.theme';

/** Read the saved preference, tolerating a browser that blocks storage. */
function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return typeof matchMedia === 'function' &&
    matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/** The theme to paint before the user has expressed a preference. */
export function initialTheme(): Theme {
  return storedTheme() ?? systemTheme();
}

/**
 * Theme state, persisted per user and applied as a class on `<html>`.
 *
 * A class rather than the media query alone, so an explicit choice beats the OS
 * setting — someone rehearsing in a dark room should not be forced back to the
 * light theme because their phone is on auto.
 */
export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void } {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // A private window can refuse storage. The toggle still works for this
      // session; only the memory of it is lost.
    }
  }, []);

  const toggle = useCallback(() => {
    setThemeState((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* see above */
      }
      return next;
    });
  }, []);

  // Follow the OS only while the user has made no explicit choice.
  useEffect(() => {
    if (storedTheme() !== null) return;
    if (typeof matchMedia !== 'function') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setThemeState(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return { theme, setTheme, toggle };
}
