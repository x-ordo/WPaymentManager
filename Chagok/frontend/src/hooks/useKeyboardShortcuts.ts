/**
 * useKeyboardShortcuts hook for LEH Lawyer Portal v1
 * User Story 6: Global Search - Keyboard shortcuts
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';

interface ShortcutConfig {
  key: string;
  metaKey?: boolean; // Cmd on Mac, Ctrl on Windows
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description?: string;
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: ShortcutConfig[];
  enabled?: boolean;
}

/**
 * Hook for handling global keyboard shortcuts
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions): void {
  const shortcutMapRef = useRef<Map<string, ShortcutConfig[]>>(new Map());

  useEffect(() => {
    const map = new Map<string, ShortcutConfig[]>();
    const modifierCombos = [
      [false, false],
      [true, false],
      [false, true],
      [true, true],
    ] as const;

    for (const shortcut of shortcuts) {
      if (!shortcut.key) continue;
      const key = shortcut.key.toLowerCase();
      const shiftPressed = Boolean(shortcut.shiftKey);
      const altPressed = Boolean(shortcut.altKey);

      for (const [metaPressed, ctrlPressed] of modifierCombos) {
        if (shortcut.metaKey && !(metaPressed || ctrlPressed)) continue;
        if (shortcut.ctrlKey && !ctrlPressed) continue;

        const comboKey = buildShortcutKey(key, {
          metaPressed,
          ctrlPressed,
          shiftPressed,
          altPressed,
        });
        const existing = map.get(comboKey);
        if (existing) {
          existing.push(shortcut);
        } else {
          map.set(comboKey, [shortcut]);
        }
      }
    }

    shortcutMapRef.current = map;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;
      if (!event.key) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      const comboKey = buildShortcutKey(event.key.toLowerCase(), {
        metaPressed: event.metaKey,
        ctrlPressed: event.ctrlKey,
        shiftPressed: event.shiftKey,
        altPressed: event.altKey,
      });
      const candidates = shortcutMapRef.current.get(comboKey) ?? [];

      for (const shortcut of candidates) {
        if (shortcut.enabled === false) continue;
        if (!shortcut.key || !event.key) continue;
        // For shortcuts requiring meta/ctrl, allow even in input fields
        const requiresModifier = shortcut.metaKey || shortcut.ctrlKey;

        if (!isInputField || requiresModifier) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.action();
          return;
        }
      }
    },
    [enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handleKeyDown]);
}

function buildShortcutKey(
  key: string,
  {
    metaPressed,
    ctrlPressed,
    shiftPressed,
    altPressed,
  }: {
    metaPressed: boolean;
    ctrlPressed: boolean;
    shiftPressed: boolean;
    altPressed: boolean;
  }
): string {
  const parts = [
    metaPressed && 'meta',
    ctrlPressed && 'ctrl',
    shiftPressed && 'shift',
    altPressed && 'alt',
    key,
  ].filter(Boolean);

  return parts.join('-');
}

/**
 * Helper to detect OS for showing correct shortcut key
 */
export function getModifierKey(): string {
  if (typeof window === 'undefined') return 'Ctrl';
  // navigator.platform is deprecated, use userAgent as fallback
  const platform = navigator.platform || navigator.userAgent || '';
  const isMac = platform.toUpperCase().indexOf('MAC') >= 0;
  return isMac ? '⌘' : 'Ctrl';
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: ShortcutConfig): string {
  const parts: string[] = [];
  const modKey = getModifierKey();

  if (shortcut.metaKey) {
    parts.push(modKey);
  }
  if (shortcut.ctrlKey && !shortcut.metaKey) {
    parts.push('Ctrl');
  }
  if (shortcut.shiftKey) {
    parts.push('Shift');
  }
  if (shortcut.altKey) {
    parts.push('Alt');
  }
  // Guard against undefined shortcut.key
  if (shortcut.key) {
    parts.push(shortcut.key.toUpperCase());
  }

  return parts.join(' + ');
}
