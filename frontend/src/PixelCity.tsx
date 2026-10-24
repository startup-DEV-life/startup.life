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
        <div className="pixel-roads" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="pixel-district district-one">DEV DISTRICT</div>
        <div className="pixel-district district-two">MARKET ROW</div>
        <div className="pixel-district district-three">CAMPUS</div>
        {destinations.map((place, index) => {
          const position = toPercent(place.x ?? 0, place.y ?? 0);
          return <button key={`${place.id}-${index}`} className={`pixel-place ${palettes[index % palettes.length]} ${active?.id === place.id ? 'active' : ''}`} style={position} onClick={(event) => { event.stopPropagation(); onPlace(place); }} aria-label={`Travel to ${place.name}`}><span className="pixel-building" /><b>{place.emoji || '◆'} {place.name}</b></button>;
        })}
        {online.slice(0, 20).map((person, index) => <span className="pixel-remote" key={person.id || index} style={toPercent(person.x ?? 0, person.y ?? 0)} title={person.name || 'Developer'}>●</span>)}
        <div className="pixel-player" style={player}><span>●</span><b>{playerName || 'You'}</b></div>
      </div>
      <div className="pixel-city-caption"><b>{dungeonActive ? 'SHATTERLINE RIFT' : 'LAGOS DEV DISTRICT'}</b><span>{enteredBuilding ? `Inside ${enteredBuilding.name}` : `${weather || 'Clear'} · click the map to walk`}</span></div>
      <div className="pixel-legend"><span><i className="legend-player" /> You</span><span><i className="legend-place" /> Places</span><span><i className="legend-online" /> Online</span></div>
    </section>
  );
}
