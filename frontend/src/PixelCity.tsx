import { useEffect, useState, type MutableRefObject } from 'react';

type PixelCityProps = {
  playerRef: MutableRefObject<any>;
  playerName: string;
  online: any[];
  places: any[];
  jobs: any[];
  active: any;
  enteredBuilding: any;
  dungeonActive: boolean;
  weather: string;
  onPlace: (place: any) => void;
  onMapMove: (position: { x: number; y: number }) => void;
  onObstacles: (obstacles: any[]) => void;
};

const WORLD = { minX: -760, maxX: 1810, minY: -750, maxY: 2230, w: 2570, h: 2980 };
const palettes = ['mint', 'gold', 'coral', 'blue', 'violet'];
const regions = [
  { name: 'MAKOKO HARBOR', className: 'harbor', x: 15, y: 70 },
  { name: 'YABA CODE GROVE', className: 'grove', x: 32, y: 20 },
  { name: 'FREEDOM RIDGE', className: 'ridge', x: 52, y: 13 },
  { name: 'VICTORIA TECH QUARTER', className: 'tech', x: 72, y: 28 },
  { name: 'LEKKI MAKER COAST', className: 'coast', x: 78, y: 73 },
  { name: 'SURULERE MARKET ROW', className: 'market', x: 33, y: 74 },
  { name: 'UNILAG LEARNING FIELDS', className: 'campus', x: 52, y: 54 },
  { name: 'IKOYI GARDENS', className: 'garden', x: 70, y: 54 },
];
const npcs = [
  { name: 'Ada', role: 'Frontend mentor', x: 35, y: 26, tone: 'teal', line: 'Your next UI challenge is waiting in Learn.' },
  { name: 'Tobi', role: 'Backend guide', x: 53, y: 57, tone: 'gold', line: 'Build small, test often, and ship the API.' },
  { name: 'Zainab', role: 'Founder', x: 72, y: 35, tone: 'coral', line: 'Pitch your idea at the Founder Commons.' },
  { name: 'Kunle', role: 'Game tester', x: 22, y: 71, tone: 'violet', line: 'Try the board games after your coding quest.' },
  { name: 'Mira', role: 'Career scout', x: 47, y: 19, tone: 'blue', line: 'Your skill path can change as you learn.' },
  { name: 'Bisi', role: 'Community host', x: 68, y: 59, tone: 'mint', line: 'Welcome to the brightest district in the city.' },
  { name: 'Emeka', role: 'Open-source guide', x: 82, y: 75, tone: 'teal', line: 'A good pull request tells a clear story.' },
  { name: 'Sade', role: 'Design coach', x: 58, y: 38, tone: 'gold', line: 'Make every screen useful before making it fancy.' },
];
const skyline = Array.from({ length: 66 }, (_, index) => ({
  id: index,
  x: 4 + ((index * 17) % 91),
  y: 9 + ((index * 29) % 83),
  size: 1 + (index % 3),
  tone: palettes[index % palettes.length],
}));

function toPercent(x: number, y: number) {
  return {
    left: `${Math.max(3, Math.min(97, ((x - WORLD.minX) / WORLD.w) * 100))}%`,
    top: `${Math.max(5, Math.min(95, ((y - WORLD.minY) / WORLD.h) * 100))}%`,
  };
}

export default function PixelCity({
  playerRef,
  playerName,
  online,
  places,
  jobs,
  active,
  enteredBuilding,
  dungeonActive,
  weather,
  onPlace,
  onMapMove,
  onObstacles,
}: PixelCityProps) {
  const [, render] = useState(0);
  const [npcMessage, setNpcMessage] = useState('Meet the residents of Startup.life and discover a coding path.');
  useEffect(() => {
    onObstacles([]);
    const timer = window.setInterval(() => render((value) => value + 1), 100);
    return () => window.clearInterval(timer);
  }, [onObstacles]);
  const player = toPercent(playerRef.current.x, playerRef.current.y);
  const destinations = [...places, ...jobs.map((job) => ({ ...job, kind: 'Career' }))].slice(0, 38);
  return (
    <section className={`pixel-city ${dungeonActive ? 'pixel-rift' : ''}`} aria-label="Pixel art city map">
      <div className="pixel-sky" aria-hidden="true"><i /><i /><i /></div>
      <div className="pixel-water" aria-hidden="true" />
      <div className="pixel-map" onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        onMapMove({
          x: WORLD.minX + ((event.clientX - rect.left) / rect.width) * WORLD.w,
          y: WORLD.minY + ((event.clientY - rect.top) / rect.height) * WORLD.h,
        });
      }}>
        <div className="pixel-terrain" aria-hidden="true"><i className="pixel-mountains" /><i className="pixel-forest forest-one" /><i className="pixel-forest forest-two" /><i className="pixel-lagoon" /><i className="pixel-sand" /></div>
        <div className="pixel-roads" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
        {skyline.map((building) => <i key={building.id} className={`pixel-skyline ${building.tone} size-${building.size}`} style={{ left: `${building.x}%`, top: `${building.y}%` }} aria-hidden="true" />)}
        {regions.map((region) => <div key={region.name} className={`pixel-region ${region.className}`} style={{ left: `${region.x}%`, top: `${region.y}%` }}>{region.name}</div>)}
        {destinations.map((place, index) => {
          const position = toPercent(place.x ?? 0, place.y ?? 0);
          return <button key={`${place.id}-${index}`} className={`pixel-place ${palettes[index % palettes.length]} ${active?.id === place.id ? 'active' : ''}`} style={position} onClick={(event) => { event.stopPropagation(); onPlace(place); }} aria-label={`Travel to ${place.name}`}><span className="pixel-building" /><b>{place.emoji || '◆'} {place.name}</b></button>;
        })}
        {online.slice(0, 20).map((person, index) => <span className="pixel-remote" key={person.id || index} style={toPercent(person.x ?? 0, person.y ?? 0)} title={person.name || 'Developer'}>●</span>)}
        {npcs.map((npc) => <button className={`pixel-npc ${npc.tone}`} key={npc.name} style={{ left: `${npc.x}%`, top: `${npc.y}%` }} onClick={(event) => { event.stopPropagation(); setNpcMessage(`${npc.name} · ${npc.role}: ${npc.line}`); }} aria-label={`Talk to ${npc.name}, ${npc.role}`}><i>●</i><b>{npc.name}</b></button>)}
        <div className="pixel-player" style={player}><span>●</span><b>{playerName || 'You'}</b></div>
      </div>
      <div className="pixel-city-caption"><b>{dungeonActive ? 'SHATTERLINE RIFT' : 'STARTUP.LIFE · OPEN WORLD'}</b><span>{enteredBuilding ? `Inside ${enteredBuilding.name}` : `${weather || 'Clear'} · click the map to walk`}</span><small>{npcMessage}</small></div>
      <div className="pixel-legend"><span><i className="legend-player" /> You</span><span><i className="legend-place" /> Buildings</span><span><i className="legend-npc" /> NPCs</span><span><i className="legend-online" /> Online</span></div>
    </section>
  );
}
