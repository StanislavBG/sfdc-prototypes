import { useState, useEffect, useCallback } from 'react';

const AUTH_KEY = 'sfdc_auth_token';

export function isAuthenticated(): boolean {
  return sessionStorage.getItem(AUTH_KEY) === 'authenticated';
}

export function clearAuth(): void {
  sessionStorage.removeItem(AUTH_KEY);
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogout = useCallback(() => {
    clearAuth();
    setAuthed(false);
    setPassword('');
  }, []);

  // Intercept all fetch 401s to force re-login
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const res = await originalFetch(...args);
      if (res.status === 401) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
        if (!url.endsWith('/api/auth')) {
          handleLogout();
        }
      }
      return res;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, [handleLogout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        sessionStorage.setItem(AUTH_KEY, 'authenticated');
        setAuthed(true);
      } else {
        setError('Incorrect password');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  if (authed) return <>{children}</>;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#032D60',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: '40px 36px 32px',
          width: 360,
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#032D60',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#032D60',
            margin: '0 0 4px',
          }}
        >
          Data 360
        </h1>
        <p style={{ fontSize: 13, color: '#706E6B', margin: '0 0 24px' }}>
          Enter password to continue
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 14,
            border: `1px solid ${error ? '#c23934' : '#d8dde6'}`,
            borderRadius: 4,
            outline: 'none',
            boxSizing: 'border-box',
            marginBottom: 8,
          }}
        />
        {error && (
          <p style={{ color: '#c23934', fontSize: 13, margin: '0 0 8px' }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !password}
          style={{
            width: '100%',
            padding: '10px 0',
            fontSize: 14,
            fontWeight: 600,
            color: '#fff',
            background: loading || !password ? '#91b8d9' : '#0070d2',
            border: 'none',
            borderRadius: 4,
            cursor: loading || !password ? 'default' : 'pointer',
            marginTop: 4,
          }}
        >
          {loading ? 'Verifying...' : 'Log In'}
        </button>
      </form>
    </div>
  );
}
