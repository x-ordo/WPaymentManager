'use client';

import { ReactNode, useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CommandPalette } from '@/components/shared/CommandPalette';
import { KeyboardShortcutsHelp } from '@/components/shared/KeyboardShortcutsHelp';
import { initAnalytics } from '@/lib/analytics';

interface Props {
  children: ReactNode;
}

export function AppProviders({ children }: Props) {
  useEffect(() => {
    // Initialize performance monitoring
    initAnalytics();
  }, []);

  return (
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        {children}
        <CommandPalette />
        <KeyboardShortcutsHelp />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default AppProviders;
