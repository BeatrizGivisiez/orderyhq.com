import { useState } from 'react';

export function useTheme() {
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem('adminTheme') !== 'light'
  );

  const toggle = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('adminTheme', next ? 'dark' : 'light');
      return next;
    });
  };

  return { isDark, toggle };
}
