import type { Theme } from '../lib/heat';
import { PillButton } from './PillButton';

export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return (
    <PillButton
      tone="accent"
      onClick={onToggle}
      aria-pressed={theme === 'dark'}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? '☾ Dark' : '☀ Light'}
    </PillButton>
  );
}
