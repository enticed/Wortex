'use client';

import { useState, ReactNode } from 'react';
import Header from './Header';
import SideMenu from './SideMenu';

interface AppLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
}

export default function AppLayout({ children, showHeader = true }: AppLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div id="game-root">
      {showHeader && <Header onMenuToggle={() => setMenuOpen(true)} />}
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Main content - full viewport for game, with top padding otherwise */}
      <main className={showHeader ? 'pt-12' : ''}>
        {children}
      </main>
    </div>
  );
}
