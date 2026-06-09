import React from 'react';
import { Theme } from '../types';
import { IconSun, IconMoon, IconCode, IconHelp } from './Icons';

interface HeaderProps {
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  onOpenShortcuts: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, setTheme, onOpenShortcuts }) => {
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    <header className="flex-shrink-0 flex items-center justify-between p-2 bg-light-surface dark:bg-dark-surface border-b border-light-border dark:border-dark-border shadow-sm">
      <div className="flex items-center gap-2">
        <IconCode className="w-8 h-8 text-light-accent dark:text-dark-accent" />
        <h1 className="text-xl font-bold text-light-text dark:text-dark-text">JSON DataGrid</h1>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenShortcuts}
          title="Keyboard shortcuts (?)"
          aria-label="Show keyboard shortcuts"
          className="p-2 rounded-full hover:bg-light-border dark:hover:bg-dark-border transition-colors"
        >
          <IconHelp className="w-5 h-5" />
        </button>
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-full hover:bg-light-border dark:hover:bg-dark-border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-light-accent dark:focus:ring-dark-accent focus:ring-offset-light-surface dark:focus:ring-offset-dark-surface transition-colors"
        >
          {theme === 'light' ? <IconMoon className="w-6 h-6" /> : <IconSun className="w-6 h-6" />}
        </button>
      </div>
    </header>
  );
};

export default Header;
