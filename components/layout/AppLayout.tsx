'use client';

import { useState, ReactNode } from 'react';
import Header from './Header';
import SideMenu from './SideMenu';

interface AppLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  isArchiveMode?: boolean;
  isGamePage?: boolean; // New prop to indicate if this is a game page (prevents scrolling)
}

export default function AppLayout({ children, showHeader = true, isArchiveMode = false, isGamePage = false }: AppLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div id={isGamePage ? 'game-root' : undefined}>
      {showHeader && <Header onMenuToggle={() => setMenuOpen(true)} isArchiveMode={isArchiveMode} />}
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Main content - full viewport for game, with top padding otherwise */}
      <main className={showHeader ? 'pt-12' : ''}>
        {children}
      </main>
    </div>
  );
}
