import { useEffect } from 'react';
import { useUserPref } from '@/hooks/use-user-pref';

export type Theme = 'light' | 'dark' | 'system';

export function ThemeSync() {
  const [theme] = useUserPref<Theme>('mirats-theme', 'system');

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = (resolvedTheme: 'light' | 'dark') => {
      root.classList.remove('light', 'dark');
      root.classList.add(resolvedTheme);
      root.dataset.theme = resolvedTheme;
      root.style.colorScheme = resolvedTheme;
      
      // Sync with Astryx if necessary
      root.setAttribute('data-astryx-theme-mode', resolvedTheme);
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyTheme(mediaQuery.matches ? 'dark' : 'light');
      };
      
      handleChange();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  return null;
}
