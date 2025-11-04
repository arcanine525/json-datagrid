import React from 'react';
import { Theme } from '../types';
import { IconSun, IconMoon, IconCode } from './Icons';

interface HeaderProps {
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
}

const Header: React.FC<HeaderProps> = ({ theme, setTheme }) => {
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <header className="flex-shrink-0 flex items-center justify-between p-2 bg-light-surface dark:bg-dark-surface border-b border-light-border dark:border-dark-border shadow-sm">
      <div className="flex items-center gap-2">
        <IconCode className="w-8 h-8 text-light-accent dark:text-dark-accent" />
        <h1 className="text-xl font-bold text-light-text dark:text-dark-text">JSON DataGrid</h1>
      </div>
      <button
        onClick={toggleTheme}
        className="p-2 rounded-full hover:bg-light-border dark:hover:bg-dark-border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-light-accent dark:focus:ring-dark-accent focus:ring-offset-light-surface dark:focus:ring-offset-dark-surface transition-colors"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? <IconMoon className="w-6 h-6" /> : <IconSun className="w-6 h-6" />}
      </button>
    </header>
  );
};

export default Header;