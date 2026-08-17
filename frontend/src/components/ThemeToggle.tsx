import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-btn"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun size={16} className="theme-icon" />
      ) : (
        <Moon size={16} className="theme-icon" />
      )}
      <span className="theme-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>

      <style>{`
        .theme-toggle-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.045);
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          position: relative;
          overflow: hidden;
        }

        .theme-toggle-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%);
          opacity: 0;
          transition: opacity var(--transition-fast);
          pointer-events: none;
        }

        .theme-toggle-btn:hover::before {
          opacity: 1;
        }

        .theme-toggle-btn:hover {
          color: var(--text-primary);
          border-color: var(--border-active);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.15);
          transform: translateY(-1px);
        }

        .theme-icon {
          transition: transform var(--transition-fast);
        }

        .theme-toggle-btn:hover .theme-icon {
          transform: rotate(20deg) scale(1.1);
        }

        .theme-label {
          font-family: var(--font-mono);
          letter-spacing: 0.02em;
        }

        @media (max-width: 640px) {
          .theme-label {
            display: none;
          }

          .theme-toggle-btn {
            padding: 7px;
          }
        }
      `}</style>
    </button>
  );
};

export default ThemeToggle;
