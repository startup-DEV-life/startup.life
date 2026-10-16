import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Code2,
  Coins,
  Download,
  ExternalLink,
  FileText,
  Flame,
  GraduationCap,
  Lock,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TerminalSquare,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';
import codingQuestData from '../../shared/data/coding-quests.json';

const roomTabs: [string, string, typeof Sparkles][] = [
  ['home', 'Overview', Sparkles],
  ['drills', 'Drill room', Target],
  ['projects', 'Projects', Code2],
  ['books', 'Book room', BookOpen],
  ['videos', 'Video room', Play],
];
const codingQuests: any[] = codingQuestData;
const projects = [
  {
    title: 'Island profile page',
    type: 'Frontend · starter',
    icon: '01',
    description:
      'Build a friendly profile page and publish a working version in your own GitHub repository.',
    deliverables: [
      'Accessible profile form',
      'Responsive project cards',
      'README with setup steps',
    ],
    skills: ['HTML', 'CSS', 'GitHub'],
    color: 'mint',
  },
  {
    title: 'Community help API',
    type: 'Backend · Python',
    icon: '02',
    description:
      'Create a small API for help requests, validate input, and persist records safely.',
    deliverables: ['Create and list requests', 'Python validation', 'Database test'],
    skills: ['Python', 'FastAPI', 'SQL'],
    color: 'peach',
  },
  {
    title: 'Classroom progress app',
    type: 'Full stack · capstone',
    icon: '03',
    description:
      'Connect a learner dashboard to a tested API and make one end-to-end learning flow.',
    deliverables: ['React/TypeScript UI', 'Authenticated API route', 'Tests and deployment notes'],
    skills: ['React', 'API design', 'Git'],
    color: 'lilac',
  },
];
async function request(path: string, options: any = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body && typeof options.body === 'string'
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}
function youtubeId(url: string) {
  try {
    const u = new URL(url);
    return u.hostname === 'youtu.be'
      ? u.pathname.slice(1)
      : u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).at(-1) || '';
  } catch {
    return '';
  }
}

export default function LearnHub({
  lessons,
  completed = [],
  player,
  onClose,
  onComplete,
  embedded = false,
  isAdmin = false,
  onPlayerUpdate = (updated: any) => {},
  onRequestAuth = () => {},
  initialRoom = '',
}: {
  lessons: any[];
  completed?: any[];
  player?: any;
  onClose?: () => void;
  onComplete?: (...args: any[]) => any;
  embedded?: boolean;
  isAdmin?: boolean;
  onPlayerUpdate?: (updated: any) => void;
  onRequestAuth?: () => void;
  initialRoom?: string;
}) {
  const savedTab = () => {
    try {
      return localStorage.getItem('blank-life-learning-tab') || 'home';
    } catch {
      return 'home';
    }
  };
  const [tab, setTab] = useState(savedTab),
    [selected, setSelected] = useState<string | null>(null),
    [choice, setChoice] = useState<number | null>(null),
    [result, setResult] = useState<any>(null),
    [saving, setSaving] = useState(false),
    [query, setQuery] = useState(''),
    [codeQuest, setCodeQuest] = useState(codingQuests[0]?.id || ''),
    [code, setCode] = useState(codingQuests[0]?.starter || ''),
    [codeDone, setCodeDone] = useState<string[]>([]),
    [codeMessage, setCodeMessage] = useState(''),
    [github, setGithub] = useState<any>(null),
    [repos, setRepos] = useState<any[]>([]),
    [repoPage, setRepoPage] = useState(1),
    [repoMore, setRepoMore] = useState(false),
    [repoLoading, setRepoLoading] = useState(false),
    [references, setReferences] = useState<any[]>([]),
    [bookList, setBookList] = useState<any[]>([]),
    [videos, setVideos] = useState<any[]>([]),
    [libraryMessage, setLibraryMessage] = useState(''),
    [bookTitle, setBookTitle] = useState(''),
    [bookLanguage, setBookLanguage] = useState('Python'),
    [bookDescription, setBookDescription] = useState(''),
    [bookPrice, setBookPrice] = useState(50),
    [bookFile, setBookFile] = useState<File | null>(null),
    [videoTitle, setVideoTitle] = useState(''),
    [videoLanguage, setVideoLanguage] = useState('Python'),
    [videoDescription, setVideoDescription] = useState(''),
    [videoUrl, setVideoUrl] = useState('');
  const done = new Set<string>(completed),
    progress = lessons.filter((x) => done.has(x.id)).length,
    lesson = lessons.find((x) => x.id === selected),
    next = lessons.find((x) => !done.has(x.id)) || lessons.at(-1),
    pct = lessons.length ? Math.round((progress / lessons.length) * 100) : 0,
    xp = player?.xp || 0,
    rank =
      xp >= 2500
        ? 'S'
        : xp >= 2000
          ? 'A'
          : xp >= 1500
            ? 'B'
            : xp >= 1000
              ? 'C'
              : xp >= 500
                ? 'D'
                : 'E',
    trialCleared = done.has('orientation-trial');
  const stages = [...new Set<string>(lessons.map((x: any) => String(x.stage)))],
    filtered = useMemo(
      () =>
        lessons.filter((x) =>
          `${x.title} ${x.stage} ${x.summary}`.toLowerCase().includes(query.toLowerCase()),
        ),
      [lessons, query],
    ),
    careerLanguages: Record<string, string[]> = {
      'frontend-engineer': ['JavaScript', 'TypeScript'],
      'product-designer': ['JavaScript', 'TypeScript'],
      'backend-engineer': ['Python', 'Go'],
      'fullstack-engineer': ['Python', 'JavaScript', 'TypeScript'],
      'security-engineer': ['Python', 'Go'],
      'game-developer': ['JavaScript', 'TypeScript'],
      'ai-researcher': ['Python'],
      'refinery-software-engineer': ['Python', 'Go'],
      'healthtech-developer': ['Python', 'JavaScript'],
      'edtech-engineer': ['Python', 'JavaScript'],
      'fintech-engineer': ['Python', 'Go'],
      'agritech-developer': ['Python', 'JavaScript'],
      'cloud-engineer': ['Python', 'Go'],
    },
    careerQuests = codingQuests.filter((q) =>
      (careerLanguages[player?.jobId] || ['Python', 'JavaScript', 'TypeScript', 'Go']).includes(
        q.language,
      ),
    ),
    currentQuest =
      careerQuests.find((q) => q.id === codeQuest) || careerQuests[0] || codingQuests[0],
    questTracks = [...new Set(careerQuests.map((q) => q.track))];
  const setRoom = (id: string) => {
    if (id !== 'home' && !trialCleared) return;
    setTab(id);
    try {
      localStorage.setItem('blank-life-learning-tab', id);
    } catch {}
    setSelected(null);
    setResult(null);
  };
  const openLesson = (item: any, index = lessons.indexOf(item)) => {
    if (index > progress) return;
    setSelected(item.id);
    setChoice(null);
    setResult(
      done.has(item.id) ? { correct: true, already: true, explanation: item.explanation } : null,
    );
  };
  const submit = async () => {
    if (choice === null || !lesson) return;
    setSaving(true);
    try {
      setResult(await onComplete(lesson.id, choice));
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setSaving(false);
    }
  };
  const goHome = () => {
    setSelected(null);
    setChoice(null);
    setResult(null);
    setTab('home');
    try {
      localStorage.setItem('blank-life-learning-tab', 'home');
    } catch {}
  };
  const loadRepos = async (page = 1, append = false) => {
    setRepoLoading(true);
    try {
      const d = await request(`/api/github/repos?page=${page}`);
      setRepos((old) => (append ? [...old, ...d.items] : d.items));
      setRepoMore(d.hasMore);
      setRepoPage(page);
    } catch (error: any) {
      setLibraryMessage(error.message);
    } finally {
      setRepoLoading(false);
    }
  };
  useEffect(() => {
    if (initialRoom) setRoom(initialRoom);
  }, [initialRoom]);
  useEffect(() => {
    if (!trialCleared && tab !== 'home') setTab('home');
  }, [trialCleared, tab]);
  useEffect(() => {
    const first = careerQuests[0];
    if (first) {
      setCodeQuest(first.id);
      setCode(first.starter);
      setCodeMessage('');
    }
  }, [player?.jobId]);
  useEffect(() => {
    if (player?.id) {
      if (!trialCleared) return;
      request('/api/coding/progress')
        .then((d) => setCodeDone(d.completed || []))
        .catch(() => {});
      return;
    }
    try {
      setCodeDone(JSON.parse(localStorage.getItem('blank-life-coding-done') || '[]'));
    } catch {
      setCodeDone([]);
    }
  }, [player?.id, trialCleared]);
  useEffect(() => {
    if (tab === 'drills' && currentQuest) {
      let live = true;
      request(
        `/api/resources?q=${encodeURIComponent(currentQuest.language + ' beginner')}&type=book&limit=4`,
      )
        .then((d) => live && setReferences(d.items || []))
        .catch(() => live && setReferences([]));
      return () => {
        live = false;
      };
    }
  }, [tab, currentQuest?.language]);
  useEffect(() => {
    if (tab === 'projects') {
      request('/api/github/status')
        .then((d: any) => {
          setGithub(d);
          if (d.linked) loadRepos(1, false);
        })
        .catch((e: any) => setGithub({ error: e.message }));
    }
    if (tab === 'books')
      request('/api/learn/books')
        .then((d) => setBookList(d.items || []))
        .catch((e) => setLibraryMessage(e.message));
    if (tab === 'videos')
      request('/api/learn/videos')
        .then((d) => setVideos(d.items || []))
        .catch((e) => setLibraryMessage(e.message));
  }, [tab, player?.id]);
  useEffect(() => {
    const q = codingQuests.find((x) => x.id === codeQuest);
    if (q) setCode(q.starter);
  }, [codeQuest]);
  const submitCode = async () => {
    if (!currentQuest) return;
    const missing = currentQuest.checks.filter((part: string) => !code.includes(part));
    if (missing.length) {
      setCodeMessage(
        `Not quite yet. Check the hint and make sure your code includes: ${missing.join(', ')}`,
      );
      return;
    }
    setSaving(true);
    try {
      if (player?.id) {
        const d = await request('/api/coding/complete', {
          method: 'POST',
          body: JSON.stringify({ questId: currentQuest.id, code }),
        });
        setCodeDone(d.completed || [...codeDone, currentQuest.id]);
        if (d.player) onPlayerUpdate(d.player);
        setCodeMessage(
          d.already
            ? 'Quest already cleared.'
            : `Quest cleared · +${d.reward?.xp || currentQuest.reward} XP · +${d.reward?.learningCoins || Math.round(currentQuest.reward / 2)} Startup coins`,
        );
      } else {
        const next = [...new Set([...codeDone, currentQuest.id])];
        setCodeDone(next);
        try {
          localStorage.setItem('blank-life-coding-done', JSON.stringify(next));
        } catch {}
        setCodeMessage('Quest checks passed. Sign in to save progress and collect Startup coins.');
      }
    } catch (error: any) {
      setCodeMessage(error.message);
    } finally {
      setSaving(false);
    }
  };
  const connectGithub = () => {
    try {
      localStorage.setItem('blank-life-learning-tab', 'projects');
    } catch {}
    window.location.assign('/api/github/link');
  };
  const disconnectGithub = async () => {
    try {
      await request('/api/github/link', { method: 'DELETE' });
      setGithub({ ...github, linked: false });
      setRepos([]);
      setLibraryMessage('GitHub disconnected.');
    } catch (e: any) {
      setLibraryMessage(e.message);
    }
  };
  const buyBook = async (book: any) => {
    if (!player?.id) {
      onRequestAuth();
      return;
    }
    try {
      const d = await request(`/api/learn/books/${book.id}/buy`, { method: 'POST', body: '{}' });
      onPlayerUpdate(d.player);
      setBookList((a) => a.map((b) => (b.id === book.id ? { ...b, owned: true } : b)));
      setLibraryMessage(`Unlocked “${book.title}”.`);
    } catch (e: any) {
      setLibraryMessage(e.message);
    }
  };
  const uploadBook = async (e: any) => {
    e.preventDefault();
    if (!bookFile) return setLibraryMessage('Choose a PDF to upload.');
    try {
      const meta = {
        title: bookTitle,
        language: bookLanguage,
        description: bookDescription,
        price: bookPrice,
      };
      const response = await fetch('/api/admin/learn/books', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/pdf',
          'X-Book-Meta': encodeURIComponent(JSON.stringify(meta)),
        },
        body: bookFile,
      });
      const d = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(d.error || 'PDF upload failed.');
      setBookList((a) => [d, ...a]);
      setBookTitle('');
      setBookDescription('');
      setBookPrice(50);
      setBookFile(null);
      setLibraryMessage('PDF added to the book room.');
    } catch (e: any) {
      setLibraryMessage(e.message);
    }
  };
  const postVideo = async (e: any) => {
    e.preventDefault();
    try {
      const d = await request('/api/admin/learn/videos', {
        method: 'POST',
        body: JSON.stringify({
          title: videoTitle,
          language: videoLanguage,
          description: videoDescription,
          youtubeUrl: videoUrl,
        }),
      });
      setVideos((a) => [d, ...a]);
      setVideoTitle('');
      setVideoDescription('');
      setVideoUrl('');
      setLibraryMessage('Video added to the room.');
    } catch (e: any) {
      setLibraryMessage(e.message);
    }
  };
  const removeVideo = async (id: string) => {
    try {
      await request(`/api/admin/learn/videos/${id}`, { method: 'DELETE' });
      setVideos((a) => a.filter((v) => v.id !== id));
    } catch (e: any) {
      setLibraryMessage(e.message);
    }
  };
  return (
    <div
      className={embedded ? 'learn-shade embedded-learn' : 'learn-shade'}
      onClick={embedded ? undefined : onClose}
    >
      <section
        className={embedded ? 'learn-panel embedded-learn-panel' : 'learn-panel'}
        onClick={(e) => e.stopPropagation()}
        aria-label="Startup.life learning campus"
      >
        <header className="lh-topbar">
          <div className="lh-brand">
            <span className="lh-brand-icon">
              <GraduationCap size={19} />
            </span>
            <span>
              STARTUP.LIFE <i>·</i> LEARNING CAMPUS
            </span>
          </div>
          <div className="lh-live">
            <span /> {trialCleared ? 'ROOMS UNLOCKED' : 'TRIAL GATE'}
          </div>
          <button className="learn-close" onClick={onClose} aria-label="Close learning campus">
            <X size={18} />
          </button>
        </header>
        <nav className="lh-nav" role="tablist" aria-label="Learning rooms">
          {roomTabs.map(([id, label, Icon]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              aria-disabled={id !== 'home' && !trialCleared}
              className={`${tab === id ? 'active' : ''} ${id !== 'home' && !trialCleared ? 'room-locked' : ''}`}
              onClick={() => setRoom(id)}
              title={
                id !== 'home' && !trialCleared
                  ? 'Clear the Overview trial to unlock this room'
                  : undefined
              }
            >
              <Icon size={15} />
              {label}
              {id !== 'home' && !trialCleared && <Lock size={11} />}
            </button>
          ))}
          {trialCleared && (
            <a href="https://arena.talentnation.ai/drills" target="_blank" rel="noreferrer">
              Talentnation <ExternalLink size={12} />
            </a>
          )}
        </nav>
        {lesson ? (
          <div className="lh-content learn-lesson">
            <button className="learn-back" onClick={goHome}>
              <ArrowLeft size={14} /> Back to Overview
            </button>
            <div className="lh-lesson-top">
              <div>
                <div className="learn-kicker">
                  {lesson.stage} <span>·</span> {lesson.duration}
                </div>
                <h2>{lesson.title}</h2>
                <p>{lesson.summary}</p>
              </div>
              <div className="lh-lesson-stamp">
                <Brain size={21} />
                <small>
                  TRIAL
                  <br />
                  GATE
                </small>
              </div>
            </div>
            <div className="lh-brief-head">
              <span>TRIAL SCENARIO</span>
              <small>Read, reason, choose</small>
            </div>
            <div className="learn-brief">
              <Brain size={18} />
              <p>{lesson.brief}</p>
            </div>
            <div className="lh-answer-label">CHOOSE THE STRONGEST FIRST MOVE</div>
            <div className="learn-choices">
              {lesson.choices.map((item: string, i: number) => (
                <button
                  key={item}
                  disabled={!!result && !result.error}
                  className={`${choice === i ? 'selected' : ''} ${result && !result.error ? (i === lesson.answer ? 'correct' : choice === i ? 'incorrect' : '') : ''}`}
                  onClick={() => setChoice(i)}
                >
                  <span>{String.fromCharCode(65 + i)}</span>
                  {item}
                  {result && !result.error && i === lesson.answer && <Check size={16} />}
                </button>
              ))}
            </div>
            {result && !result.error && (
              <div className="learn-feedback">
                <b>
                  {result.correct ? 'Good reasoning.' : 'Not quite yet.'}
                  {result.correct && !result.already && result.xp
                    ? ` +${result.xp} XP · +${result.coins} Startup coins`
                    : ''}
                </b>
                <span>{result.explanation || lesson.explanation}</span>
              </div>
            )}
            {result?.error && <div className="learn-error">{result.error}</div>}
            {!result && (
              <button
                className="learn-submit"
                disabled={choice === null || saving}
                onClick={submit}
              >
                {saving ? 'Checking…' : 'Submit trial answer'}
                <ArrowRight size={16} />
              </button>
            )}
            {result &&
              !result.error &&
              (!result.correct ? (
                <button
                  className="learn-submit"
                  onClick={() => {
                    setChoice(null);
                    setResult(null);
                  }}
                >
                  Try again <ArrowRight size={16} />
                </button>
              ) : (
                <button className="learn-submit" onClick={goHome}>
                  Return to campus <ArrowRight size={16} />
                </button>
              ))}
          </div>
        ) : (
          <div className="lh-content">
            {tab === 'home' && (
              <>
                <div className="lh-welcome">
                  <div>
                    <span className="lh-eyebrow">
                      <Sparkles size={13} /> FIELD TRIAL · ROOM ACCESS
                    </span>
                    <h1>
                      Clear your first gate.
                      <br />
                      <em>Open the campus.</em>
                    </h1>
                    <p>
                      Start with a short reasoning challenge. Clear it to unlock coding quests, your
                      GitHub project room, the PDF book shelf, and the video classroom.
                    </p>
                    <button
                      className="lh-primary"
                      onClick={() =>
                        openLesson(lessons.find((x) => x.id === 'orientation-trial') || next, 0)
                      }
                    >
                      <Play size={15} fill="currentColor" />{' '}
                      {trialCleared ? 'Replay the welcome trial' : 'Start the welcome trial'}{' '}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                  <div className="lh-orbit" aria-hidden="true">
                    <div className="lh-orbit-ring ring-a" />
                    <div className="lh-orbit-ring ring-b" />
                    <div className="lh-orbit-core">
                      <Code2 size={35} />
                    </div>
                    <span className="orbit-node node-a">PY</span>
                    <span className="orbit-node node-b">GO</span>
                    <span className="orbit-node node-c">&lt;/&gt;</span>
                    <span className="orbit-spark">✦</span>
                  </div>
                  <div className="lh-welcome-bottom">
                    <span>
                      <b>01</b> TRIAL
                    </span>
                    <i>→</i>
                    <span>
                      <b>02</b> UNLOCK
                    </span>
                    <i>→</i>
                    <span>
                      <b>03</b> BUILD
                    </span>
                  </div>
                </div>
                <div className="lh-stats">
                  <div>
                    <span className="lh-stat-icon">
                      <Target size={15} />
                    </span>
                    <small>TRIAL PROGRESS</small>
                    <b>
                      {progress}
                      <i>/{lessons.length}</i>
                    </b>
                    <div className="lh-meter">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div>
                    <span className="lh-stat-icon amber">
                      <Flame size={15} />
                    </span>
                    <small>PLAYER RANK</small>
                    <b>
                      {rank}
                      <i> class</i>
                    </b>
                    <div className="lh-stat-note">{xp} career XP</div>
                  </div>
                  <div>
                    <span className="lh-stat-icon violet">
                      <Trophy size={15} />
                    </span>
                    <small>CODING QUESTS</small>
                    <b>
                      {codeDone.length}
                      <i>/{codingQuests.length}</i>
                    </b>
                    <div className="lh-stat-note">Python · Go · JavaScript · TypeScript</div>
                  </div>
                </div>
                <div className="lh-section-head">
                  <div>
                    <span className="lh-eyebrow">YOUR NEXT STEP</span>
                    <h2>{trialCleared ? 'Choose a learning room' : 'Clear the Overview trial'}</h2>
                  </div>
                </div>
                <div className="campus-room-list">
                  {roomTabs.slice(1).map(([id, label, Icon]) => (
                    <button key={id} disabled={!trialCleared} onClick={() => setRoom(id)}>
                      <Icon size={17} />
                      <span>
                        <b>{label}</b>
                        <small>
                          {id === 'drills'
                            ? 'Beginner coding quests in Python, Go, JavaScript, and TypeScript'
                            : id === 'projects'
                              ? 'Connect GitHub and browse your own repositories'
                              : id === 'books'
                                ? 'Admin-posted programming PDFs purchased with Startup coins'
                                : 'Admin-curated YouTube lessons'}
                        </small>
                      </span>
                      {trialCleared ? <ArrowRight size={15} /> : <Lock size={14} />}
                    </button>
                  ))}
                </div>
              </>
            )}
            {tab === 'drills' && trialCleared && (
              <>
                <div className="lh-page-heading">
                  <div>
                    <span className="lh-eyebrow">
                      <Target size={13} /> BEGINNER QUEST ROOM
                    </span>
                    <h1>Learn by writing code.</h1>
                    <p>
                      Choose a language path, follow the hint, edit the starter code, and clear
                      quests one small step at a time.
                    </p>
                  </div>
                  <div className="lh-drill-count">
                    <b>
                      {codeDone.length}
                      <i>/{codingQuests.length}</i>
                    </b>
                    <small>QUESTS CLEARED</small>
                  </div>
                </div>
                <div className="coding-track-row">
                  {questTracks.map((track) => {
                    const quests = careerQuests.filter((q) => q.track === track),
                      doneTrack = quests.filter((q) => codeDone.includes(q.id)).length;
                    return (
                      <button
                        key={track}
                        className={currentQuest?.track === track ? 'active' : ''}
                        onClick={() => {
                          const nextQ =
                            quests.find((q) => !codeDone.includes(q.id)) || quests.at(-1);
                          if (nextQ) {
                            setCodeQuest(nextQ.id);
                            setCode(nextQ.starter);
                            setCodeMessage('');
                          }
                        }}
                      >
                        <span>
                          {track.includes('Python')
                            ? '🐍'
                            : track.includes('Go')
                              ? '🐹'
                              : track.includes('TypeScript')
                                ? '🔷'
                                : '🌐'}
                        </span>
                        <b>{track}</b>
                        <small>
                          {doneTrack}/{quests.length} quests
                        </small>
                      </button>
                    );
                  })}
                </div>
                <div className="coding-quest-layout">
                  <aside className="coding-quest-rail">
                    <b className="coding-rail-title">{currentQuest?.track || 'Quest path'}</b>
                    {careerQuests
                      .filter((q) => q.track === currentQuest?.track)
                      .map((q: any, index: number) => {
                        const group = careerQuests.filter((x) => x.track === q.track),
                          stepDone = group.filter((x) => codeDone.includes(x.id)).length,
                          locked = index > stepDone;
                        return (
                          <button
                            key={q.id}
                            disabled={locked}
                            className={`${q.id === codeQuest ? 'active' : ''} ${codeDone.includes(q.id) ? 'cleared' : ''}`}
                            onClick={() => {
                              setCodeQuest(q.id);
                              setCode(q.starter);
                              setCodeMessage('');
                            }}
                          >
                            <span>
                              {codeDone.includes(q.id) ? (
                                <Check size={14} />
                              ) : locked ? (
                                <Lock size={13} />
                              ) : (
                                String(index + 1).padStart(2, '0')
                              )}
                            </span>
                            <b>{q.title.replace(/^Quest \d+ · /, '')}</b>
                          </button>
                        );
                      })}
                  </aside>
                  <section className="coding-quest-card">
                    <div className="coding-quest-heading">
                      <span>
                        {currentQuest?.language} · {currentQuest?.level}
                      </span>
                      <b>{currentQuest?.title}</b>
                    </div>
                    <p className="coding-story">{currentQuest?.story}</p>
                    <div className="coding-objective">
                      <Target size={15} />
                      <span>
                        <b>Quest goal</b>
                        {currentQuest?.objective}
                      </span>
                    </div>
                    <label className="coding-editor-label">
                      <span>
                        <TerminalSquare size={14} /> YOUR CODE
                      </span>
                      <small>
                        Quest validation checks structure; code runs only in your browser editor.
                      </small>
                    </label>
                    <textarea
                      className="coding-editor"
                      aria-label={`${currentQuest?.language} code editor`}
                      spellCheck={false}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                    <div className="coding-hint">
                      <Sparkles size={14} />
                      <span>
                        <b>Hint</b>
                        {currentQuest?.hint}
                      </span>
                    </div>
                    {codeMessage && (
                      <div
                        className={`coding-message ${codeMessage.startsWith('Quest cleared') || codeMessage.startsWith('Quest checks passed') ? 'success' : ''}`}
                      >
                        {codeMessage}
                      </div>
                    )}
                    <div className="coding-submit-row">
                      <span>
                        Clear quest · <b>+{currentQuest?.reward} XP</b>
                      </span>
                      <button
                        onClick={submitCode}
                        disabled={saving || codeDone.includes(currentQuest?.id)}
                      >
                        {codeDone.includes(currentQuest?.id) ? (
                          <>
                            <Check size={15} /> Quest cleared
                          </>
                        ) : (
                          <>
                            {saving ? 'Checking…' : 'Submit quest'} <ArrowRight size={15} />
                          </>
                        )}
                      </button>
                    </div>
                    <p className="coding-safety">
                      This room checks that your code contains the lesson's required constructs. It
                      does not execute Python, Go, or JavaScript yet.
                    </p>
                  </section>
                </div>
                <div className="coding-material-note">
                  <BookOpen size={15} />
                  <span>
                    Want a free language reference? Use the{' '}
                    <a
                      href="https://github.com/EbookFoundation/free-programming-books"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Free Programming Books catalog
                    </a>{' '}
                    alongside your admin-curated Book Room.
                  </span>
                </div>
                {references.length > 0 && (
                  <section className="coding-reference-shelf">
                    <div>
                      <BookOpen size={14} />
                      <b>Open-book references · {currentQuest?.language}</b>
                      <a
                        href="https://github.com/EbookFoundation/free-programming-books"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Source catalog <ExternalLink size={11} />
                      </a>
                    </div>
                    {references.map((ref: any) => (
                      <a key={ref.id} href={ref.sourceUrl} target="_blank" rel="noreferrer">
                        <span>
                          {ref.title}
                          <small>
                            {(ref.languages || []).slice(0, 3).join(' · ') || 'Programming'}
                          </small>
                        </span>
                        <ExternalLink size={12} />
                      </a>
                    ))}
                  </section>
                )}
              </>
            )}
            {tab === 'projects' && trialCleared && (
              <>
                <div className="lh-page-heading">
                  <div>
                    <span className="lh-eyebrow">
                      <Code2 size={13} /> YOUR GITHUB WORKSPACE
                    </span>
                    <h1>Projects</h1>
                    <p>
                      Link your GitHub to browse your public and private repositories from inside
                      Startup.life.
                    </p>
                  </div>
                  <span className="lh-studio-mark">
                    <BriefcaseBusiness size={23} />
                  </span>
                </div>
                {github?.linked ? (
                  <>
                    <div className="github-connected">
                      <span className="github-avatar">
                        {github.avatarUrl ? <img src={github.avatarUrl} alt="" /> : '◉'}
                      </span>
                      <span>
                        <b>Connected as @{github.login}</b>
                        <small>Repositories are read from GitHub using your authorization.</small>
                      </span>
                      <button onClick={disconnectGithub}>Disconnect</button>
                    </div>
                    <div className="github-repo-heading">
                      <b>Your repositories</b>
                      <span>{repos.length} loaded · private repos included</span>
                      <button onClick={() => loadRepos(1, false)} disabled={repoLoading}>
                        {repoLoading ? 'Refreshing…' : 'Refresh'}
                      </button>
                    </div>
                    {libraryMessage && <p className="library-status">{libraryMessage}</p>}
                    <div className="github-repo-list">
                      {repos.map((repo: any) => (
                        <article className="github-repo" key={repo.id}>
                          <div className="github-repo-symbol">
                            <Code2 size={17} />
                          </div>
                          <div>
                            <a href={repo.htmlUrl} target="_blank" rel="noreferrer">
                              {repo.fullName}
                              <ExternalLink size={12} />
                            </a>
                            <p>{repo.description || 'No repository description yet.'}</p>
                            <small>
                              <i className={repo.private ? 'private' : 'public'} />
                              {repo.private ? 'Private' : 'Public'}
                              {repo.language && <> · {repo.language}</>} · updated{' '}
                              {new Date(repo.updatedAt).toLocaleDateString()}
                            </small>
                          </div>
                          <a
                            className="github-open"
                            href={repo.htmlUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Open ${repo.fullName}`}
                          >
                            <ArrowRight size={15} />
                          </a>
                        </article>
                      ))}
                    </div>
                    {repos.length === 0 && !repoLoading && (
                      <div className="library-empty">
                        No repositories came back from GitHub. Check your account permissions and
                        refresh.
                      </div>
                    )}
                    {repoMore && (
                      <button
                        className="library-more"
                        onClick={() => loadRepos(repoPage + 1, true)}
                        disabled={repoLoading}
                      >
                        {repoLoading ? 'Loading…' : 'Load more repositories'}
                      </button>
                    )}
                    <div className="github-privacy-note">
                      <ShieldCheck size={15} />
                      <span>
                        Startup.life stores the GitHub token encrypted on the server. The current
                        GitHub OAuth <code>repo</code> permission can authorize writes, but this
                        screen only reads repository details and opens the GitHub page. You can
                        disconnect here or revoke access in GitHub settings.
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="github-connect-panel">
                    <div className="github-octocat">GH</div>
                    <div>
                      <h2>Bring your portfolio into the island.</h2>
                      <p>
                        Link GitHub to see your own repositories, including private repositories you
                        authorize. Projects you create outside the game appear here too.
                      </p>
                      <button
                        className="lh-primary github-connect-button"
                        disabled={!github?.configured}
                        onClick={connectGithub}
                      >
                        {github?.configured ? 'Connect GitHub' : 'GitHub setup needed'}{' '}
                        <ArrowRight size={15} />
                      </button>
                      {github?.error && <p className="library-status">{github.error}</p>}
                      {github?.configured === false && (
                        <small>
                          Admin setup required: GitHub OAuth client credentials and a 32-byte token
                          encryption key.
                        </small>
                      )}
                      {!player?.id && <small>Sign in to link your GitHub account.</small>}
                    </div>
                    <div className="github-feature-list">
                      <span>
                        <Check size={14} /> Public & private repository list
                      </span>
                      <span>
                        <Check size={14} /> Language and latest update
                      </span>
                      <span>
                        <Check size={14} /> Jump to work on GitHub
                      </span>
                    </div>
                  </div>
                )}
                <div className="project-starters">
                  <div className="lh-section-head">
                    <div>
                      <span className="lh-eyebrow">STARTUP.LIFE STARTER BRIEFS</span>
                      <h2>Starter projects</h2>
                    </div>
                  </div>
                  <div className="lh-project-grid">
                    {projects.map((p) => (
                      <article className={`lh-project-card ${p.color}`} key={p.title}>
                        <div className="lh-project-card-top">
                          <span>{p.icon}</span>
                          <small>{p.type}</small>
                        </div>
                        <h2>{p.title}</h2>
                        <p>{p.description}</p>
                        <div className="lh-deliverables">
                          <b>PROJECT GOALS</b>
                          {p.deliverables.map((d) => (
                            <span key={d}>
                              <Check size={13} />
                              {d}
                            </span>
                          ))}
                        </div>
                        <div className="lh-skill-tags">
                          {p.skills.map((skill) => (
                            <span key={skill}>{skill}</span>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </>
            )}
            {tab === 'books' && trialCleared && (
              <>
                <div className="lh-page-heading">
                  <div>
                    <span className="lh-eyebrow">
                      <BookOpen size={13} /> THE READING ROOM
                    </span>
                    <h1>Programming books</h1>
                    <p>
                      Admin-posted programming PDFs. Unlock a title with Startup coins and keep it
                      in your library.
                    </p>
                  </div>
                  <span className="book-wallet">
                    <Coins size={17} /> {player?.learningCoins ?? 0} Startup coins
                  </span>
                </div>
                {libraryMessage && <p className="library-status">{libraryMessage}</p>}
                {isAdmin && (
                  <form className="library-admin-form" onSubmit={uploadBook}>
                    <h2>
                      <Plus size={16} /> Add a PDF book
                    </h2>
                    <div className="library-form-grid">
                      <label>
                        Title
                        <input
                          value={bookTitle}
                          onChange={(e) => setBookTitle(e.target.value)}
                          required
                          maxLength={120}
                        />
                      </label>
                      <label>
                        Language
                        <input
                          value={bookLanguage}
                          onChange={(e) => setBookLanguage(e.target.value)}
                          required
                          maxLength={48}
                        />
                      </label>
                      <label>
                        Price in Startup coins
                        <input
                          type="number"
                          value={bookPrice}
                          min={0}
                          max={100000}
                          onChange={(e) => setBookPrice(Number(e.target.value))}
                        />
                      </label>
                      <label>
                        PDF file
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          onChange={(e) => setBookFile(e.target.files?.[0] || null)}
                          required
                        />
                      </label>
                      <label className="wide">
                        Description
                        <textarea
                          value={bookDescription}
                          onChange={(e) => setBookDescription(e.target.value)}
                          maxLength={500}
                        />
                      </label>
                    </div>
                    <button className="library-admin-submit">
                      <Plus size={14} /> Publish to Book Room
                    </button>
                  </form>
                )}
                <div className="book-store-grid">
                  {bookList.map((book) => (
                    <article className="book-store-item" key={book.id}>
                      <span className="book-cover">
                        <FileText size={25} />
                        <small>PDF · {book.language}</small>
                      </span>
                      <div className="book-store-copy">
                        <small>{book.language.toUpperCase()} · PROGRAMMING</small>
                        <h2>{book.title}</h2>
                        <p>
                          {book.description ||
                            'Admin-selected reading material for your developer journey.'}
                        </p>
                        <div>
                          {book.owned ? (
                            <a href={`/api/learn/books/${book.id}/download`}>
                              <Download size={14} /> Download PDF
                            </a>
                          ) : (
                            <button onClick={() => buyBook(book)}>
                              <Coins size={14} /> Unlock · {book.price} Startup coins
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                {bookList.length === 0 && (
                  <div className="library-empty">
                    <BookOpen size={24} />
                    <b>The shelves are waiting.</b>
                    <span>Programming PDFs will appear here when an administrator adds them.</span>
                  </div>
                )}
                <p className="library-credit">
                  Admin-provided PDF materials are stored privately by Startup.life. Purchased PDFs
                  are only downloadable by the player who unlocked them.
                </p>
              </>
            )}
            {tab === 'videos' && trialCleared && (
              <>
                <div className="lh-page-heading">
                  <div>
                    <span className="lh-eyebrow">
                      <Play size={13} /> VIDEO CLASSROOM
                    </span>
                    <h1>Watch and learn</h1>
                    <p>YouTube lessons curated and posted by Startup.life administrators.</p>
                  </div>
                  <span className="lh-studio-mark">
                    <Play size={22} />
                  </span>
                </div>
                {libraryMessage && <p className="library-status">{libraryMessage}</p>}
                {isAdmin && (
                  <form className="library-admin-form" onSubmit={postVideo}>
                    <h2>
                      <Plus size={16} /> Post a YouTube lesson
                    </h2>
                    <div className="library-form-grid">
                      <label>
                        Title
                        <input
                          value={videoTitle}
                          onChange={(e) => setVideoTitle(e.target.value)}
                          required
                          maxLength={120}
                        />
                      </label>
                      <label>
                        Language
                        <input
                          value={videoLanguage}
                          onChange={(e) => setVideoLanguage(e.target.value)}
                          required
                          maxLength={48}
                        />
                      </label>
                      <label>
                        YouTube URL
                        <input
                          type="url"
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          required
                          placeholder="https://www.youtube.com/watch?v=…"
                        />
                      </label>
                      <label>
                        Description
                        <input
                          value={videoDescription}
                          onChange={(e) => setVideoDescription(e.target.value)}
                          maxLength={500}
                        />
                      </label>
                    </div>
                    <button className="library-admin-submit">
                      <Plus size={14} /> Publish video
                    </button>
                  </form>
                )}
                <div className="video-library">
                  {videos.map((video) => {
                    const id = youtubeId(video.youtubeUrl);
                    return (
                      <article className="video-library-item" key={video.id}>
                        <div className="video-frame">
                          {id ? (
                            <iframe
                              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`}
                              title={video.title}
                              loading="lazy"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              referrerPolicy="strict-origin-when-cross-origin"
                              allowFullScreen
                            />
                          ) : (
                            <a href={video.youtubeUrl} target="_blank" rel="noreferrer">
                              Watch on YouTube <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                        <div className="video-copy">
                          <small>{video.language} · ADMIN CURATED</small>
                          <h2>{video.title}</h2>
                          <p>{video.description}</p>
                          <a href={video.youtubeUrl} target="_blank" rel="noreferrer">
                            Open on YouTube <ExternalLink size={13} />
                          </a>
                          {isAdmin && (
                            <button onClick={() => removeVideo(video.id)}>
                              <Trash2 size={13} /> Remove
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
                {videos.length === 0 && (
                  <div className="library-empty">
                    <Play size={24} />
                    <b>No lessons posted yet.</b>
                    <span>Videos added by the learning administrator will appear here.</span>
                  </div>
                )}
              </>
            )}
            <div className="learn-official">
              <span>
                Independent learning features. GitHub, YouTube, and book publishers remain their
                respective owners. Startup coins and XP are fictional game rewards.
              </span>
              <a href="https://arena.talentnation.ai/drills" target="_blank" rel="noreferrer">
                Visit Talentnation <ExternalLink size={13} />
              </a>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
