import { useEffect } from 'react';
import { useUserPref } from '@/hooks/use-user-pref';

export type Theme = 'light' | 'dark' | 'system';

/** Giá trị mặc định là LIGHT: dark chỉ bật khi người dùng tự chọn. */
export const DEFAULT_THEME: Theme = 'light';

export function ThemeSync() {
  const [theme] = useUserPref<Theme>('mirats-theme', DEFAULT_THEME);

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

    // 'system' (cũ) hoặc giá trị lạ được chuẩn hoá về LIGHT — không tự bật dark
    // theo hệ điều hành. Dark chỉ áp dụng khi người dùng chọn 'dark'.
    applyTheme(theme === 'dark' ? 'dark' : 'light');
  }, [theme]);

  return null;
}
