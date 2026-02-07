/**
 * Client-side CSRF token utilities
 * Handles fetching and including CSRF tokens in requests
 */

const CSRF_TOKEN_STORAGE_KEY = 'wortex-csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Fetch a new CSRF token from the server
 * This should be called when the app loads and after authentication
 */
export async function fetchCsrfToken(): Promise<string | null> {
  try {
    console.log('[CSRF Client] Fetching CSRF token from /api/csrf-token');
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'include', // Include cookies
    });

    if (!response.ok) {
      console.error('[CSRF Client] Failed to fetch CSRF token:', response.status);
      return null;
    }

    const data = await response.json();
    const token = data.token;

    if (token) {
      // Store token in memory for this session
      sessionStorage.setItem(CSRF_TOKEN_STORAGE_KEY, token);
      console.log('[CSRF Client] Token stored in sessionStorage, length:', token.length);
      return token;
    }

    console.warn('[CSRF Client] No token in response');
    return null;
  } catch (error) {
    console.error('[CSRF Client] Error fetching CSRF token:', error);
    return null;
  }
}

/**
 * Get the current CSRF token from session storage
 */
export function getCsrfToken(): string | null {
  if (typeof window === 'undefined') {
    return null; // Server-side rendering
  }

  return sessionStorage.getItem(CSRF_TOKEN_STORAGE_KEY);
}

/**
 * Add CSRF token to fetch headers
 * Use this helper when making POST/PUT/DELETE/PATCH requests
 */
export function addCsrfHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getCsrfToken();

  if (!token) {
    console.warn('No CSRF token available. Request may be rejected.');
    return headers;
  }

  return {
    ...headers,
    [CSRF_HEADER_NAME]: token,
  };
}

/**
 * Enhanced fetch wrapper that automatically includes CSRF token
 * Use this instead of native fetch for state-changing requests
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = options.method?.toUpperCase() || 'GET';

  // Only add CSRF for state-changing methods
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    // Get or fetch CSRF token if not available
    let token = getCsrfToken();
    console.log('[CSRF Client] Current token in sessionStorage:', token ? `${token.substring(0, 10)}...` : 'null');

    if (!token) {
      console.log('[CSRF Client] No token found, fetching new one...');
      token = await fetchCsrfToken();
    }

    // Add CSRF token to headers
    options.headers = addCsrfHeader(options.headers);
    console.log('[CSRF Client] Headers after addCsrfHeader:', options.headers);
  }

  // Always include credentials (cookies)
  options.credentials = options.credentials || 'include';

  return fetch(url, options);
}

/**
 * Initialize CSRF protection
 * Call this when the app loads or after authentication
 */
export async function initializeCsrf(): Promise<void> {
  // Check if we already have a token
  const existingToken = getCsrfToken();
  if (existingToken) {
    return; // Already initialized
  }

  // Fetch a new token
  await fetchCsrfToken();
}

/**
 * Clear CSRF token from storage
 * Call this when user logs out
 */
export function clearCsrfToken(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(CSRF_TOKEN_STORAGE_KEY);
  }
}
