import { useEffect, useState } from 'react';
import './AdminDashboard.css';
import {
  Activity,
  BookOpen,
  Boxes,
  Check,
  ChevronRight,
  Compass,
  Gamepad2,
  Globe2,
  LoaderCircle,
  ShieldCheck,
  ToggleRight,
  Users,
  Video,
  X,
} from 'lucide-react';

const initialSettings = {
  explorationIsland: 'Lagos Island',
  features: {
    exploration: true,
    gamePass: true,
    gameLive: true,
    learningLibrary: true,
    communityChat: true,
  },
  games: { chess: true, checkers: true, wordTiles: true, propertyMarket: true, ludo: true },
};
const featureLabels: any[] = [
  [
    'exploration',
    'Island exploration',
    Compass,
    'Control access to the world map and new districts.',
  ],
  ['gamePass', 'Game Pass', Gamepad2, 'Show the curated board game collection.'],
  ['gameLive', 'Game Live', Activity, 'Allow live multiplayer game sessions.'],
  [
    'learningLibrary',
    'Book & video library',
    BookOpen,
    'Make learning resources available to players.',
  ],
  ['communityChat', 'Community chat', Users, 'Enable player chat and community activity.'],
];
const gameLabels: any[] = [
  ['chess', 'Chess'],
  ['checkers', 'Checkers'],
  ['wordTiles', 'Word Tiles'],
  ['propertyMarket', 'Property Market'],
  ['ludo', 'Ludo Royale'],
];

async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Request failed');
  return body;
}

export default function AdminDashboard({
  onClose,
  onNotice,
  onSettingsChange = undefined,
  onEnterGame = undefined,
}) {
  const [dashboard, setDashboard] = useState(null);
  const [settings, setSettings] = useState(initialSettings);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('overview');
  const [message, setMessage] = useState('');
  const [video, setVideo] = useState({
    title: '',
    language: 'English',
    description: '',
    youtubeUrl: '',
  });
  const [book, setBook] = useState({ title: '', language: 'English', description: '', price: '0' });

  const refresh = async () => {
    setBusy(true);
    try {
      const data = await request('/api/admin/dashboard');
      setDashboard(data);
      setSettings({
        ...initialSettings,
        ...data.settings,
        features: { ...initialSettings.features, ...data.settings?.features },
        games: { ...initialSettings.games, ...data.settings?.games },
      });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    refresh();
  }, []);

  const saveSettings = async (next) => {
    setSettings(next);
    setSaving(true);
    try {
      const data = await request('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(next),
      });
      setSettings(data.settings);
      onSettingsChange?.(data.settings);
      window.dispatchEvent(new CustomEvent('admin-settings-updated', { detail: data.settings }));
      setMessage('Changes saved.');
      onNotice?.('Admin settings saved.');
    } catch (error) {
      setMessage(error.message);
      await refresh();
    } finally {
      setSaving(false);
    }
  };
  const toggle = (group, key) =>
    saveSettings({ ...settings, [group]: { ...settings[group], [key]: !settings[group][key] } });
  const publishVideo = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      await request('/api/admin/learn/videos', { method: 'POST', body: JSON.stringify(video) });
      setVideo({ title: '', language: 'English', description: '', youtubeUrl: '' });
      setMessage('Video added to the learning library.');
      await refresh();
    } catch (error) {
      setMessage(error.message);
    }
  };
  const publishBook = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const file = form.elements.bookFile.files[0];
    if (!file) return setMessage('Choose a PDF to upload.');
    try {
      const meta = encodeURIComponent(JSON.stringify({ ...book, price: Number(book.price) }));
      const res = await fetch('/api/admin/learn/books', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/pdf', 'X-Book-Meta': meta },
        body: file,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Book upload failed.');
      setBook({ title: '', language: 'English', description: '', price: '0' });
      form.reset();
      setMessage('Book uploaded to the learning library.');
      await refresh();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const nav: any[] = [
    ['overview', 'Overview', Globe2],
    ['world', 'World & games', Compass],
    ['content', 'Library', BookOpen],
    ['activity', 'Activity', Activity],
  ];
  return (
    <div className="admin-shade" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="admin-dashboard" aria-label="Admin dashboard">
        <header className="admin-topbar">
          <div className="admin-brand">
            <span className="admin-mark">
              <ShieldCheck size={19} />
            </span>
            <div>
              <b>Startup.life Control</b>
              <small>ADMIN CONSOLE · {dashboard?.admin?.name || 'SIGNED IN'}</small>
            </div>
          </div>
          <div className="admin-top-actions">
            {onEnterGame && (
              <button className="admin-enter-game" onClick={onEnterGame}>
                <Gamepad2 size={15} /> Enter game
              </button>
            )}
            <button className="admin-close" onClick={onClose} aria-label="Close admin">
              <X />
            </button>
          </div>
        </header>
        <div className="admin-layout">
          <nav className="admin-nav">
            {nav.map(([id, label, Icon]) => (
              <button
                key={id}
                className={tab === id ? 'selected' : ''}
                onClick={() => {
                  setTab(id);
                  setMessage('');
                }}
              >
                <Icon size={17} />
                {label}
                <ChevronRight size={15} />
              </button>
            ))}
            <div className="admin-nav-note">
              <ShieldCheck size={16} />
              <span>
                Protected admin workspace
                <br />
                <small>Changes save to this game server.</small>
              </span>
            </div>
          </nav>
          <main className="admin-main">
            {busy ? (
              <div className="admin-loading">
                <LoaderCircle className="spin" /> Loading your dashboard…
              </div>
            ) : (
              <>
                {tab === 'overview' && (
                  <>
                    <div className="admin-heading">
                      <div>
                        <span>CONTROL ROOM</span>
                        <h1>Good to see you, {dashboard?.admin?.name || 'Admin'}.</h1>
                        <p>Monitor the island and manage what players can access.</p>
                      </div>
                      <button className="admin-refresh" onClick={refresh}>
                        <Activity size={15} /> Refresh
                      </button>
                    </div>
                    <div className="admin-stats">
                      {[
                        ['Players', dashboard?.stats?.players ?? 0, Users],
                        ['Online now', dashboard?.stats?.online ?? 0, Activity],
                        ['Library items', dashboard?.stats?.library ?? 0, BookOpen],
                        ['Open reports', dashboard?.stats?.reports ?? 0, ShieldCheck],
                      ].map(([label, value, Icon]) => (
                        <article key={label}>
                          <span>
                            <Icon size={17} />
                            {label}
                          </span>
                          <b>{value}</b>
                          <small>Current server totals</small>
                        </article>
                      ))}
                    </div>
                    <div className="admin-two-col">
                      <article className="admin-card">
                        <div className="admin-card-head">
                          <div>
                            <span>WORLD STATUS</span>
                            <h2>Next exploration</h2>
                          </div>
                          <Compass />
                        </div>
                        <p className="admin-world-name">{settings.explorationIsland}</p>
                        <label className="admin-label">
                          Featured island or district
                          <input
                            value={settings.explorationIsland}
                            maxLength={64}
                            onChange={(e) =>
                              setSettings({ ...settings, explorationIsland: e.target.value })
                            }
                            onBlur={() => saveSettings(settings)}
                          />
                        </label>
                        <p className="admin-hint">
                          This sets the next destination shown to players. World geometry can be
                          connected when a new island asset is ready.
                        </p>
                      </article>
                      <article className="admin-card">
                        <div className="admin-card-head">
                          <div>
                            <span>QUICK CONTROLS</span>
                            <h2>Player features</h2>
                          </div>
                          <ToggleRight />
                        </div>
                        {featureLabels.slice(0, 3).map(([key, label, Icon, hint]) => (
                          <div className="admin-toggle-row" key={key}>
                            <span className="admin-toggle-icon">
                              <Icon size={16} />
                            </span>
                            <span>
                              <b>{label}</b>
                              <small>{hint}</small>
                            </span>
                            <button
                              aria-label={`${settings.features[key] ? 'Disable' : 'Enable'} ${label}`}
                              className={`admin-switch ${settings.features[key] ? 'on' : ''}`}
                              onClick={() => toggle('features', key)}
                            >
                              <i />
                            </button>
                          </div>
                        ))}
                        <button className="admin-text-button" onClick={() => setTab('world')}>
                          Manage all features and games <ChevronRight size={15} />
                        </button>
                      </article>
                    </div>
                    <article className="admin-card admin-activity-card">
                      <div className="admin-card-head">
                        <div>
                          <span>LIVE FEED</span>
                          <h2>Recent activity</h2>
                        </div>
                        <button className="admin-text-button" onClick={() => setTab('activity')}>
                          View all <ChevronRight size={15} />
                        </button>
                      </div>
                      <ActivityList items={dashboard?.activity || []} />
                    </article>
                  </>
                )}
                {tab === 'world' && (
                  <>
                    <div className="admin-heading">
                      <div>
                        <span>WORLD & GAMES</span>
                        <h1>Shape the player experience.</h1>
                        <p>Choose what is open for exploration and which games appear.</p>
                      </div>
                    </div>
                    <article className="admin-card">
                      <div className="admin-card-head">
                        <div>
                          <span>EXPLORATION</span>
                          <h2>Featured destination</h2>
                        </div>
                        <Compass />
                      </div>
                      <label className="admin-label">
                        Island or district name
                        <input
                          value={settings.explorationIsland}
                          maxLength={64}
                          onChange={(e) =>
                            setSettings({ ...settings, explorationIsland: e.target.value })
                          }
                        />
                      </label>
                      <button className="admin-primary" onClick={() => saveSettings(settings)}>
                        <Check size={16} /> Save destination
                      </button>
                      <div className="admin-setting-list">
                        {featureLabels.map(([key, label, Icon, hint]) => (
                          <div className="admin-toggle-row" key={key}>
                            <span className="admin-toggle-icon">
                              <Icon size={16} />
                            </span>
                            <span>
                              <b>{label}</b>
                              <small>{hint}</small>
                            </span>
                            <button
                              aria-label={`${settings.features[key] ? 'Disable' : 'Enable'} ${label}`}
                              className={`admin-switch ${settings.features[key] ? 'on' : ''}`}
                              onClick={() => toggle('features', key)}
                            >
                              <i />
                            </button>
                          </div>
                        ))}
                      </div>
                    </article>
                    <article className="admin-card">
                      <div className="admin-card-head">
                        <div>
                          <span>GAME CATALOG</span>
                          <h2>Game Pass & Game Live</h2>
                        </div>
                        <Gamepad2 />
                      </div>
                      <p className="admin-hint">
                        Turn a game on to include it in the enabled catalog. Game files still need
                        to be added to the connected games repository before players can launch a
                        new title.
                      </p>
                      {gameLabels.map(([key, label]) => (
                        <div className="admin-toggle-row" key={key}>
                          <span className="admin-toggle-icon">
                            <Boxes size={16} />
                          </span>
                          <span>
                            <b>{label}</b>
                            <small>
                              {settings.games[key]
                                ? 'Available in the game catalog'
                                : 'Hidden from the game catalog'}
                            </small>
                          </span>
                          <button
                            aria-label={`${settings.games[key] ? 'Disable' : 'Enable'} ${label}`}
                            className={`admin-switch ${settings.games[key] ? 'on' : ''}`}
                            onClick={() => toggle('games', key)}
                          >
                            <i />
                          </button>
                        </div>
                      ))}
                    </article>
                  </>
                )}
                {tab === 'content' && (
                  <>
                    <div className="admin-heading">
                      <div>
                        <span>CONTENT STUDIO</span>
                        <h1>Publish learning content.</h1>
                        <p>Add a book or curate a video for the island library.</p>
                      </div>
                    </div>
                    <article className="admin-card">
                      <div className="admin-card-head">
                        <div>
                          <span>BOOK ROOM</span>
                          <h2>Upload a book</h2>
                        </div>
                        <BookOpen />
                      </div>
                      <form className="admin-form" onSubmit={publishBook}>
                        <label>
                          Book title
                          <input
                            required
                            value={book.title}
                            onChange={(e) => setBook({ ...book, title: e.target.value })}
                          />
                        </label>
                        <div className="admin-form-row">
                          <label>
                            Language
                            <input
                              required
                              value={book.language}
                              onChange={(e) => setBook({ ...book, language: e.target.value })}
                            />
                          </label>
                          <label>
                            Price in coins
                            <input
                              type="number"
                              min="0"
                              value={book.price}
                              onChange={(e) => setBook({ ...book, price: e.target.value })}
                            />
                          </label>
                        </div>
                        <label>
                          Description
                          <textarea
                            value={book.description}
                            maxLength={500}
                            onChange={(e) => setBook({ ...book, description: e.target.value })}
                          />
                        </label>
                        <label className="admin-file">
                          PDF file
                          <input
                            name="bookFile"
                            type="file"
                            accept="application/pdf,.pdf"
                            required
                          />
                          <small>PDF · maximum 25 MB</small>
                        </label>
                        <button className="admin-primary">
                          <BookOpen size={16} /> Upload book
                        </button>
                      </form>
                    </article>
                    <article className="admin-card">
                      <div className="admin-card-head">
                        <div>
                          <span>VIDEO ROOM</span>
                          <h2>Add a learning video</h2>
                        </div>
                        <Video />
                      </div>
                      <form className="admin-form" onSubmit={publishVideo}>
                        <label>
                          Video title
                          <input
                            required
                            value={video.title}
                            onChange={(e) => setVideo({ ...video, title: e.target.value })}
                          />
                        </label>
                        <label>
                          YouTube link
                          <input
                            type="url"
                            required
                            placeholder="https://youtube.com/watch?v=…"
                            value={video.youtubeUrl}
                            onChange={(e) => setVideo({ ...video, youtubeUrl: e.target.value })}
                          />
                        </label>
                        <div className="admin-form-row">
                          <label>
                            Language
                            <input
                              required
                              value={video.language}
                              onChange={(e) => setVideo({ ...video, language: e.target.value })}
                            />
                          </label>
                          <label>
                            Description
                            <input
                              value={video.description}
                              maxLength={500}
                              onChange={(e) => setVideo({ ...video, description: e.target.value })}
                            />
                          </label>
                        </div>
                        <button className="admin-primary">
                          <Video size={16} /> Publish video
                        </button>
                        <p className="admin-hint">
                          Video publishing currently uses a YouTube link. Direct video file uploads
                          can be added when hosted video storage is configured.
                        </p>
                      </form>
                    </article>
                  </>
                )}
                {tab === 'activity' && (
                  <>
                    <div className="admin-heading">
                      <div>
                        <span>ACTIVITY MONITOR</span>
                        <h1>What’s happening in Startup.life.</h1>
                        <p>Recent account, learning, and community events.</p>
                      </div>
                      <button className="admin-refresh" onClick={refresh}>
                        <Activity size={15} /> Refresh
                      </button>
                    </div>
                    <article className="admin-card admin-activity-card">
                      <ActivityList items={dashboard?.activity || []} />
                    </article>
                  </>
                )}
                {message && (
                  <div className="admin-message" role="status">
                    {message}
                  </div>
                )}
                {saving && <small className="admin-saving">Saving…</small>}
              </>
            )}
          </main>
        </div>
      </section>
    </div>
  );
}

function ActivityList({ items }) {
  if (!items.length) return <p className="admin-empty">No player activity to show yet.</p>;
  return (
    <div className="admin-activity-list">
      {items.slice(0, 12).map((item, index) => (
        <div key={`${item.type}-${item.occurredAt}-${index}`}>
          <span className="admin-activity-dot" />
          <div>
            <b>{item.summary}</b>
            <small>
              {item.displayName || item.username || 'Player'} ·{' '}
              {new Date(item.occurredAt).toLocaleString()}
            </small>
          </div>
          <small>@{item.username}</small>
        </div>
      ))}
    </div>
  );
}
