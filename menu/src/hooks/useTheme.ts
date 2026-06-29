'use client';

import { useState } from 'react';

const KEY = 'ordery_theme';

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem(KEY) !== 'light';
    } catch {
      return true;
    }
  });

  const toggle = () => {
    setIsDark(prev => {
      const next = !prev;
      try {
        localStorage.setItem(KEY, next ? 'dark' : 'light');
      } catch {}
      return next;
    });
  };

  return { isDark, toggle };
}
