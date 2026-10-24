import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Code2,
  Compass,
  Database,
  Layers,
  Play,
  Sparkles,
  X,
} from 'lucide-react';
import './StartupWelcome.css';

const slides = [
  {
    eyebrow: 'THE WORLD',
    title: 'A developer life in pixel form.',
    body: 'Explore a Lagos-inspired pixel city, walk between districts, enter a workplace, and make your next career move inside the world.',
    chips: ['2D pixel city', 'Explore on foot', 'Playable in browser'],
    icon: <Compass />,
    visual: 'city',
    caption: 'ONE CITY · MANY PATHS',
  },
  {
    eyebrow: 'HOW IT WAS MADE',
    title: 'The city is built with pixel art.',
    body: 'Custom TypeScript and CSS assemble a responsive top-down city, roads, buildings, player marker, and interactions into a fast 2D game map.',
    chips: ['2D pixel renderer', 'Clickable city map', 'React game interface'],
    icon: <Layers />,
    visual: 'scene',
    caption: 'SCENE → PLAYER → INTERACTION',
  },
  {
    eyebrow: 'LANGUAGES & TOOLS',
    title: 'TypeScript runs the game and server.',
    body: 'The browser client uses React, TypeScript, Vite, and CSS. The Node.js backend is also written in TypeScript and uses Express APIs and Socket.IO for live presence. Supabase SQL migrations are included, though they are not the active game database yet.',
    chips: ['TypeScript / TSX', 'JavaScript runtime: Node.js', 'SQL schema: Supabase'],
    icon: <Code2 />,
    visual: 'code',
    caption: 'ONE TYPESAFE WEB STACK',
  },
  {
    eyebrow: 'FROM SOURCE TO SCREEN',
    title: 'Built for web, with a phone-ready install.',
    body: 'Vite builds the client, Render hosts the web app and Node server, and the PWA manifest lets supported browsers install it. The current running server stores data in SQLite; Supabase schema work is present, but is not yet the live database.',
    chips: ['Vite build', 'Render hosting', 'Progressive Web App'],
    icon: <Database />,
    visual: 'ship',
    caption: 'SOURCE → BUILD → BROWSER',
  },
];

export function StartupMark({ size = 42 }: { size?: number }) {
  return (
    <svg
      className="startup-mark"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Startup.life logo"
    >
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="19"
        fill="#111b30"
        stroke="#74d8ee"
        strokeOpacity=".65"
        strokeWidth="2"
      />
      <path
        d="M43 17H27c-7 0-10 10-3 14l15 3c8 2 6 14-2 14H19"
        fill="none"
        stroke="#8ce4ef"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="19" cy="48" r="3.2" fill="#ffd16b" />
      <path d="M46 8l2.5 5.5L54 16l-5.5 2.5L46 24l-2.5-5.5L38 16l5.5-2.5L46 8z" fill="#ffd16b" />
    </svg>
  );
}

export default function StartupWelcome({
  onEnter,
  onCreate,
}: {
  onEnter: () => void;
  onCreate: () => void;
}) {
  const [slide, setSlide] = useState(0),
    current = slides[slide];
  const change = (next: number) => setSlide((next + slides.length) % slides.length);
  return (
    <section
      className="startup-welcome"
      aria-label="Startup.life welcome"
      onKeyDown={(event) => event.stopPropagation()}
    >
      <div className="welcome-atmosphere" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <span />
      </div>
      <header className="welcome-nav">
        <a className="welcome-brand" href="#welcome" aria-label="Startup.life home">
          <StartupMark />
          <span>
            startup<span>.</span>life
          </span>
        </a>
        <nav aria-label="Welcome navigation">
          <button onClick={() => change(1)}>How it works</button>
          <button onClick={() => change(2)}>Technology</button>
        </nav>
        <button className="welcome-skip" onClick={onEnter}>
          Skip intro <X size={15} />
        </button>
      </header>
      <main className="welcome-main" id="welcome">
        <section className="welcome-copy">
          <div className="welcome-status">
            <span /> A PLAYABLE DEVELOPER WORLD
          </div>
          <h1>
            Build your career.
            <br />
            <em>Live the story.</em>
          </h1>
          <p>
            Step into a living island made for people learning, building, and growing in tech.
            Explore the city, choose your path, and turn practical coding quests into progress.
          </p>
          <div className="welcome-actions">
            <button className="welcome-enter" onClick={onEnter}>
              <Play size={16} fill="currentColor" /> Enter the city <ArrowRight size={16} />
            </button>
            <button className="welcome-create" onClick={onCreate}>
              Create your profile
            </button>
          </div>
          <div className="welcome-facts">
            <span>
              <i /> Browser game
            </span>
            <span>
              <i /> Installable PWA
            </span>
            <span>
              <i /> Desktop + mobile
            </span>
          </div>
        </section>
        <section className="build-story" aria-label="How Startup.life was built">
          <div className="story-topline">
            <div>
              <span className="story-icon">{current.icon}</span>
              <span className="story-label">{current.eyebrow}</span>
            </div>
            <span className="story-counter">
              {String(slide + 1).padStart(2, '0')} <i>/</i> {String(slides.length).padStart(2, '0')}
            </span>
          </div>
          <div className={`story-visual story-${current.visual}`} aria-hidden="true">
            {current.visual === 'city' ? (
              <div className="visual-city">
                <div className="moon-glow" />
                <div className="island-shape">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <b />
                  <b />
                  <b />
                  <b />
                  <span />
                </div>
                <div className="visual-orbit orbit-a" />
                <div className="visual-orbit orbit-b" />
                <span className="visual-tag tag-north">NORTH COAST</span>
                <span className="visual-tag tag-tech">TECH PLACE</span>
                <span className="visual-tag tag-player">YOU ARE HERE</span>
              </div>
            ) : current.visual === 'code' ? (
              <div className="code-window">
                <div className="code-titlebar">
                  <span />
                  <span />
                  <span />
                  <b>src/world.tsx</b>
                </div>
                <pre>
                  <code>
                    <span className="code-purple">function</span>{' '}
                    <span className="code-cyan">buildWorld</span>() {'{'}
                    <br /> <span className="code-purple">const</span> city ={' '}
                    <span className="code-cyan">new</span> Scene();
                    <br /> city.<span className="code-yellow">add</span>(roads, buildings);
                    <br /> city.<span className="code-yellow">add</span>(player, lights);
                    <br /> <span className="code-purple">return</span> city;
                    <br />
                    {'}'}
                  </code>
                </pre>
              </div>
            ) : (
              <div className="pipeline-visual">
                <div>
                  <Layers />
                  <b>TypeScript</b>
                  <small>Game client</small>
                </div>
                <i />
                <div>
                  <Code2 />
                  <b>Node.js</b>
                  <small>API + realtime</small>
                </div>
                <i />
                <div>
                  <Sparkles />
                  <b>Browser</b>
                  <small>Play + install</small>
                </div>
              </div>
            )}
            {current.visual === 'scene' && (
              <div className="scene-visual">
                <div className="scene-sun" />
                <div className="scene-hill hill-back" />
                <div className="scene-hill hill-front" />
                <div className="scene-road" />
                <div className="scene-building building-a" />
                <div className="scene-building building-b" />
                <div className="scene-building building-c" />
                <div className="scene-person" />
                <span>THREE.JS · WEBGL</span>
              </div>
            )}
          </div>
          <div className="story-content">
            <span className="story-caption">{current.caption}</span>
            <h2>{current.title}</h2>
            <p>{current.body}</p>
            <div className="story-chips">
              {current.chips.map((chip) => (
                <span key={chip}>{chip}</span>
              ))}
            </div>
          </div>
          <div className="story-controls">
            <div className="story-dots" role="tablist" aria-label="Build story slides">
              {slides.map((item, index) => (
                <button
                  key={item.eyebrow}
                  role="tab"
                  aria-label={`Slide ${index + 1}: ${item.eyebrow}`}
                  aria-selected={index === slide}
                  className={index === slide ? 'active' : ''}
                  onClick={() => change(index)}
                />
              ))}
            </div>
            <div className="story-arrows">
              <button onClick={() => change(slide - 1)} aria-label="Previous slide">
                <ArrowLeft size={16} />
              </button>
              <button onClick={() => change(slide + 1)} aria-label="Next slide">
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </main>
      <footer className="welcome-footer">
        <span>
          startup.life <i>·</i> LAGOS DEVELOPER CITY
        </span>
        <span>Explore first. Choose a path when you’re ready.</span>
      </footer>
    </section>
  );
}
