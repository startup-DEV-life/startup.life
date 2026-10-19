import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpRight,
  Camera,
  FileUp,
  Github,
  Mic,
  RefreshCw,
  Send,
  Square,
  Video,
} from 'lucide-react';

const GAMEUP_REPO = 'https://github.com/startup-DEV-life/startup.life-games';
const request = async (path: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof Blob) && !(options.body instanceof ArrayBuffer))
    headers.set('Content-Type', 'application/json');
  const response = await fetch(path, { credentials: 'include', ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
};

export function GameUpApp() {
  return (
    <section className="device-app-page gameup-app">
      <h2>Your island game room</h2>
      <p>
        Open the shared board-game hub for chess, checkers, Scrabble, and property-trading games.
      </p>
      <a className="device-primary-link" href={GAMEUP_REPO} target="_blank" rel="noreferrer">
        <Github size={16} /> Open GameUp repository <ArrowUpRight size={15} />
      </a>
      <small>Repository access follows the permissions on your GitHub account.</small>
    </section>
  );
}

type DeviceAppsProps = {
  accountType: 'beginner' | 'developer' | 'grower' | string;
  username?: string;
  compact?: boolean;
};

export function DemoAndFilesApp({ accountType, username = '', compact = false }: DeviceAppsProps) {
  const [feed, setFeed] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [recording, setRecording] = useState(false);
  const [clip, setClip] = useState<Blob | null>(null);
  const [clipUrl, setClipUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'demos' | 'files'>('demos');
  const [recipientId, setRecipientId] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const cameraRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const role = accountType;

  const load = useCallback(async () => {
    if (!username) return;
    setError('');
    try {
      const results = await Promise.all([
        request('/api/demos'),
        request('/api/files'),
        role === 'developer' ? request('/api/people') : Promise.resolve({ people: [] }),
      ]);
      setFeed(results[0].demos || []);
      setFiles(results[1].files || []);
      setPeople(results[2].people || []);
    } catch (e: any) {
      setError(e.message);
    }
  }, [username, role]);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (clipUrl) URL.revokeObjectURL(clipUrl);
    },
    [clipUrl],
  );

  const startRecording = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError(
        'This browser does not support camera recording. Try a current version of Chrome, Edge, or Firefox.',
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (cameraRef.current) cameraRef.current.srcObject = stream;
      const preferred = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, preferred ? { mimeType: preferred } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' });
        setClip(blob);
        setClipUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (cameraRef.current) cameraRef.current.srcObject = null;
        setRecording(false);
      };
      recorder.start(1000);
      setRecording(true);
    } catch (e: any) {
      setError(
        e.name === 'NotAllowedError'
          ? 'Camera or microphone access was denied. Allow access in your browser settings and try again.'
          : e.message,
      );
    }
  };
  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };
  const publish = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!clip) return setError('Record a demo clip before publishing.');
    if (!title.trim() || !repoUrl.trim())
      return setError('Add a title and the GitHub repository link for this demo.');
    setBusy(true);
    setError('');
    try {
      await request('/api/demos', {
        method: 'POST',
        headers: {
          'Content-Type': clip.type || 'video/webm',
          'X-Demo-Title': encodeURIComponent(title.trim()),
          'X-Demo-Caption': encodeURIComponent(caption.trim()),
          'X-Demo-Repo': encodeURIComponent(repoUrl.trim()),
        },
        body: clip,
      });
      setClip(null);
      setClipUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return '';
      });
      setTitle('');
      setCaption('');
      setRepoUrl('');
      await load();
      setMessage('Demo published to the Growers feed.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const sendFile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem('transfer-file') as HTMLInputElement;
    const file = input.files?.[0];
    if (!recipientId || !file) return setError('Choose a recipient and a file.');
    setBusy(true);
    setError('');
    try {
      await request('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-File-Name': encodeURIComponent(file.name),
          'X-File-Type': file.type || 'application/octet-stream',
          'X-Recipient-Id': recipientId,
        },
        body: file,
      });
      form.reset();
      setMessage(
        `File sent to ${people.find((person) => person.id === recipientId)?.name || 'player'}.`,
      );
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!username)
    return (
      <section className="device-app-page">
        <h2>Sign in to use this app</h2>
        <p>Demo publishing and file transfers are linked to your player account.</p>
      </section>
    );
  if (role === 'beginner')
    return (
      <section className="device-app-page">
        <h2>Build your skills first</h2>
        <p>
          Career paths and learning drills are available to beginners. Demo publishing and developer
          file transfers unlock with a Developer profile.
        </p>
      </section>
    );

  return (
    <section className={`device-app-page demo-app ${compact ? 'compact' : ''}`}>
      <h2>{role === 'grower' ? 'Developer demo feed' : 'Developer studio'}</h2>
      <div className="device-app-tabs">
        <button
          className={activeTab === 'demos' ? 'active' : ''}
          onClick={() => setActiveTab('demos')}
        >
          <Video size={14} /> Demo feed
        </button>
        <button
          className={activeTab === 'files' ? 'active' : ''}
          onClick={() => setActiveTab('files')}
        >
          <FileUp size={14} /> Files
        </button>
        <button onClick={() => void load()} aria-label="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>
      {message && <p className="device-app-message">{message}</p>}
      {error && (
        <p className="device-app-error" role="alert">
          {error}
        </p>
      )}

      {activeTab === 'demos' &&
        (role === 'developer' ? (
          <>
            <form className="demo-publish-form" onSubmit={publish}>
              <label>RECORD A PROJECT DEMO</label>
              <video ref={cameraRef} className="demo-camera-preview" autoPlay muted playsInline />
              <div className="demo-record-actions">
                {!recording ? (
                  <button type="button" onClick={() => void startRecording()}>
                    <Camera size={15} />
                    <Mic size={14} /> Enable camera & record
                  </button>
                ) : (
                  <button type="button" className="recording" onClick={stopRecording}>
                    <Square size={13} /> Stop recording
                  </button>
                )}
                {clip && <small>{(clip.size / (1024 * 1024)).toFixed(1)} MB ready</small>}
              </div>
              {clipUrl && (
                <video className="demo-clip-preview" src={clipUrl} controls playsInline />
              )}
              <input
                required
                maxLength={80}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Demo title"
              />
              <textarea
                maxLength={500}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What did you build? (optional)"
              />
              <input
                required
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/you/project"
              />
              <button className="device-primary-button" disabled={busy || recording || !clip}>
                <Send size={14} /> {busy ? 'Publishing…' : 'Publish to Growers'}
              </button>
              <small>
                Publishing uploads this clip to the game’s server. Maximum 50 MB. Include a
                repository link.
              </small>
            </form>
            <h3 className="device-section-title">Your published demos</h3>
          </>
        ) : (
          <h3 className="device-section-title">Scroll demos from developers</h3>
        ))}

      {activeTab === 'demos' && (
        <div className="demo-feed-list">
          {feed.map((demo) => (
            <article className="demo-feed-card" key={demo.id}>
              <video src={`/api/demos/${demo.id}/video`} controls playsInline preload="metadata" />
              <div>
                <small>
                  {demo.developerName} · {new Date(demo.publishedAt).toLocaleDateString()}
                </small>
                <h3>{demo.title}</h3>
                {demo.caption && <p>{demo.caption}</p>}
                <a href={demo.repoUrl} target="_blank" rel="noreferrer">
                  <Github size={14} /> View project repository <ArrowUpRight size={13} />
                </a>
              </div>
            </article>
          ))}
          {!feed.length && (
            <p className="device-app-empty">
              {role === 'grower'
                ? 'No demos published yet. Check back when developers share their work.'
                : 'Your demos will appear here after publishing.'}
            </p>
          )}
        </div>
      )}

      {activeTab === 'files' && (
        <>
          {role === 'developer' && (
            <form className="file-send-form" onSubmit={sendFile}>
              <label>SEND A FILE · 15 MB MAXIMUM</label>
              <select required value={recipientId} onChange={(e) => setRecipientId(e.target.value)}>
                <option value="">Choose a player</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name} (@{person.username}) · {person.accountType}
                  </option>
                ))}
              </select>
              <input required name="transfer-file" type="file" />
              <button className="device-primary-button" disabled={busy}>
                <Send size={14} /> Send file
              </button>
            </form>
          )}
          <h3 className="device-section-title">Inbox & sent files</h3>
          <div className="device-file-list">
            {files.map((file) => (
              <article key={file.id}>
                <span>
                  <b>{file.filename}</b>
                  <small>
                    {file.direction === 'received'
                      ? `From ${file.senderName}`
                      : `To ${file.recipientName}`}{' '}
                    · {(file.byteSize / 1024).toFixed(0)} KB
                  </small>
                </span>
                <a href={`/api/files/${file.id}/download`}>
                  <ArrowDownToLine size={15} /> Download
                </a>
              </article>
            ))}
            {!files.length && (
              <p className="device-app-empty">Files shared with you will appear here.</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export { GAMEUP_REPO };
