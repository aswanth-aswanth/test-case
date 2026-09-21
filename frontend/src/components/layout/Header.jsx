import React from 'react';
import { Zap, Menu, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

function Header() {
  const { sidebarOpen, setSidebarOpen } = useApp();

  return (
    <header
      className="flex items-center h-14 px-4 shrink-0"
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Sidebar toggle */}
      <button
        onClick={() => setSidebarOpen((open) => !open)}
        className="btn-ghost mr-3 p-2"
        style={{
          border: 'none',
          background: 'transparent',
          color: 'var(--color-text-muted)',
        }}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center w-7 h-7 rounded-lg"
          style={{ background: 'var(--color-accent)' }}
        >
          <Zap size={14} color="white" />
        </div>

        <span
          className="font-semibold text-sm tracking-tight"
          style={{ color: 'var(--color-text)' }}
        >
          Test Case Generator
        </span>
      </div>
    </header>
  );
}

export default Header;