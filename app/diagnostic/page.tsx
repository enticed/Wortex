'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/contexts/UserContext';

export default function DiagnosticPage() {
  const { userId, userData, loading } = useUser();
  const [sessionTest, setSessionTest] = useState<any>(null);
  const [cookieTest, setCookieTest] = useState<any>(null);

  useEffect(() => {
    // Test session API
    fetch('/api/auth/session', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setSessionTest(data))
      .catch(err => setSessionTest({ error: err.message }));

    // Test cookie debug
    fetch('/api/debug/session-test')
      .then(r => r.json())
      .then(data => setCookieTest(data))
      .catch(err => setCookieTest({ error: err.message }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Authentication Diagnostic</h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
          <h2 className="text-xl font-semibold mb-2">UserContext State</h2>
          <div className="space-y-2 text-sm font-mono">
            <div>Loading: {loading ? 'true' : 'false'}</div>
            <div>userId: {userId || 'null'}</div>
            <div>userData: {userData ? JSON.stringify(userData, null, 2) : 'null'}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
          <h2 className="text-xl font-semibold mb-2">Session API Response</h2>
          <pre className="text-xs overflow-auto">
            {sessionTest ? JSON.stringify(sessionTest, null, 2) : 'Loading...'}
          </pre>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
          <h2 className="text-xl font-semibold mb-2">Cookie Test Response</h2>
          <pre className="text-xs overflow-auto">
            {cookieTest ? JSON.stringify(cookieTest, null, 2) : 'Loading...'}
          </pre>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">Browser Info</h2>
          <div className="space-y-2 text-sm font-mono">
            <div>User Agent: {typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}</div>
            <div>Cookies Enabled: {typeof window !== 'undefined' ? navigator.cookieEnabled.toString() : 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
