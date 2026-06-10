import React from 'react';
import { Theme } from '../types';
import { Locale, LOCALE_OPTIONS, t } from '../i18n';
import { IconSun, IconMoon, IconCode, IconHelp } from './Icons';

interface HeaderProps {
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  locale: Locale;
  setLocale: React.Dispatch<React.SetStateAction<Locale>>;
  onOpenShortcuts: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, setTheme, locale, setLocale, onOpenShortcuts }) => {
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    <header className="flex-shrink-0 flex items-center justify-between p-2 bg-light-surface dark:bg-dark-surface border-b border-light-border dark:border-dark-border shadow-sm">
      <div className="flex items-center gap-2">
        <IconCode className="w-8 h-8 text-light-accent dark:text-dark-accent" />
        <h1 className="text-xl font-bold text-light-text dark:text-dark-text">{t('app_title', locale)}</h1>
      </div>
      <div className="flex items-center gap-1">
        <select
          value={locale}
          onChange={e => setLocale(e.target.value as Locale)}
          aria-label={t('language', locale)}
          className="px-2 py-1.5 text-xs bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded focus:outline-none"
        >
          {LOCALE_OPTIONS.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
        </select>
        <button
          onClick={onOpenShortcuts}
          title={t('shortcuts', locale)}
          aria-label={t('shortcuts', locale)}
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
