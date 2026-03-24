'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: '#0d1f13', color: '#d1fae5', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌱</div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#d1fae5' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#6ee7b7', opacity: 0.6, fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{ padding: '0.625rem 1.25rem', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
              >
                Try again
              </button>
              <a
                href="/"
                style={{ padding: '0.625rem 1.25rem', backgroundColor: '#1a2f23', color: '#bbf7d0', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none' }}
              >
                Home
              </a>
            </div>
            {error.digest && (
              <p style={{ color: 'rgba(74,222,128,0.3)', fontSize: '0.75rem', marginTop: '1rem' }}>
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
