'use client';

import { useEffect } from 'react';
import { initializeCsrf } from '@/lib/security/csrf-client';

/**
 * Client component that initializes CSRF protection when the app loads
 * This should be included in the root layout
 */
export function CsrfInitializer() {
  useEffect(() => {
    console.log('[CsrfInitializer] Initializing CSRF protection...');

    // Initialize CSRF token when app loads
    initializeCsrf()
      .then(() => {
        console.log('[CsrfInitializer] CSRF protection initialized successfully');
      })
      .catch((error) => {
        console.error('[CsrfInitializer] Failed to initialize CSRF protection:', error);
      });
  }, []);

  // This component doesn't render anything
  return null;
}
