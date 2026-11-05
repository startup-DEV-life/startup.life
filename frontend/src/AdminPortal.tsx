import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { ArrowRight, Gamepad2, LockKeyhole, ShieldCheck } from 'lucide-react';
import AdminDashboard from './AdminDashboard.tsx';

async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Could not complete the request.');
  return data;
}

export default function AdminPortal() {
  const [status, setStatus] = useState<any>(null);
  const [dashboard, setDashboard] = useState(false);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [setup, setSetup] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    Promise.all([request('/api/admin/setup/status'), request('/api/me')])
      .then(([setupStatus, session]) => {
        setStatus(setupStatus);
        setSetup(setupStatus.setupAvailable);
        if (session.user?.isAdmin) setDashboard(true);
      })
      .catch((reason) => setError(reason.message))
      .finally(() => setBusy(false));
  }, []);

  const enterGame = () => window.location.assign('/?play=1');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    if (setup && password !== form.get('confirmPassword')) {
      setError('The passwords do not match.');
      setSaving(false);
      return;
    }
    try {
      if (setup) {
        await request('/api/admin/setup', {
          method: 'POST',
          body: JSON.stringify({
            username: form.get('username'),
            displayName: form.get('displayName'),
            password,
          }),
        });
        setNotice('Owner account created. This one-time setup is now closed.');
        setDashboard(true);
      } else {
        const session = await request('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username: form.get('username'), password }),
        });
        if (!session.user?.isAdmin) throw new Error('That account does not have admin access.');
        setDashboard(true);
      }
    } catch (reason: any) {
      setError(reason.message || 'Could not sign in.');
    } finally {
      setSaving(false);
    }
  };

  if (dashboard)
    return <AdminDashboard onClose={enterGame} onEnterGame={enterGame} onNotice={setNotice} />;

  return (
    <div className="admin-shade">
      <main className="admin-entry" aria-label={setup ? 'Create owner account' : 'Admin sign in'}>
        <div className="admin-entry-mark">
          <ShieldCheck size={23} />
        </div>
        <span className="admin-entry-kicker">STARTUP.LIFE · CONTROL ROOM</span>
        <h1>
          {busy ? 'Opening admin access…' : setup ? 'Create the owner account.' : 'Admin sign in.'}
        </h1>
        <p>
          {setup
            ? 'Set up the only owner account. This local setup closes as soon as you finish.'
            : 'Sign in with the admin account to manage the game.'}
        </p>
        {busy ? (
          <div className="admin-loading">
            <span className="spin">◌</span> Checking admin access…
          </div>
        ) : status?.localSetupRequired ? (
          <div className="admin-entry-error">
            The owner account has not been created yet. Open this page on the computer running the
            game server to complete the one-time setup.
          </div>
        ) : (
          <form className="admin-entry-form" onSubmit={submit}>
            {setup && (
              <label>
                Display name
                <input
                  name="displayName"
                  autoComplete="name"
                  minLength={2}
                  maxLength={20}
                  required
                  placeholder="Your name"
                />
              </label>
            )}
            <label>
              Username
              <input
                name="username"
                autoComplete="username"
                minLength={3}
                maxLength={18}
                pattern="[A-Za-z0-9_]+"
                required
                placeholder="3–18 letters, numbers or _"
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete={setup ? 'new-password' : 'current-password'}
                minLength={10}
                maxLength={128}
                required
                placeholder="At least 10 characters"
              />
            </label>
            {setup && (
              <label>
                Confirm password
                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={10}
                  maxLength={128}
                  required
                  placeholder="Enter it again"
                />
              </label>
            )}
            {setup && (
              <div className="admin-entry-lock">
                <LockKeyhole size={16} />
                <span>
                  One owner account only. Admin setup locks after creation; nobody else can
                  self-register as an admin.
                </span>
              </div>
            )}
            {error && (
              <div className="admin-entry-error" role="alert">
                {error}
              </div>
            )}
            <button className="admin-primary admin-entry-submit" disabled={saving}>
              {saving ? 'Please wait…' : setup ? 'Create owner account' : 'Sign in'}{' '}
              <ArrowRight size={16} />
            </button>
          </form>
        )}
        {notice && (
          <div className="admin-entry-notice" role="status">
            {notice}
          </div>
        )}
        <button className="admin-entry-game" onClick={enterGame}>
          <Gamepad2 size={16} /> Return to the game
        </button>
      </main>
    </div>
  );
}
