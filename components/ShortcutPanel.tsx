import React, { useEffect } from 'react';
import { IconClose } from './Icons';

interface ShortcutPanelProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS: Array<{ keys: string[]; label: string }> = [
  { keys: ['Ctrl/⌘', 'Alt', 'F'], label: 'Format JSON' },
  { keys: ['Ctrl/⌘', 'Alt', 'M'], label: 'Minify JSON' },
  { keys: ['Ctrl/⌘', 'F'], label: 'Search in Tree view' },
  { keys: ['?'], label: 'Toggle this shortcut panel' },
  { keys: ['Esc'], label: 'Close panels / cancel search' },
];

const Key: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="px-1.5 py-0.5 text-[11px] font-mono rounded border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg shadow-sm">
    {children}
  </kbd>
);

/**
 * Modal listing every keyboard shortcut wired into the app. Opened with `?`
 * and closed with Escape or the X button.
 */
const ShortcutPanel: React.FC<ShortcutPanelProps> = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md mx-4 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-light-border dark:border-dark-border">
          <h2 className="text-base font-semibold">Keyboard shortcuts</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border" aria-label="Close">
            <IconClose className="w-5 h-5" />
          </button>
        </div>
        <ul className="p-4 space-y-2">
          {SHORTCUTS.map((s, i) => (
            <li key={i} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-light-text-secondary dark:text-dark-text-secondary">{s.label}</span>
              <span className="flex items-center gap-1">
                {s.keys.map((k, j) => (
                  <React.Fragment key={j}>
                    <Key>{k}</Key>
                    {j < s.keys.length - 1 && <span className="text-light-text-secondary dark:text-dark-text-secondary">+</span>}
                  </React.Fragment>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ShortcutPanel;
