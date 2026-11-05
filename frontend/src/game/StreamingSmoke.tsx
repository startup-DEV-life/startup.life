/** Development-only traversal of the real renderer. This is not a production entry point. */
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ThreeCity from '../ThreeCity.tsx';
import { isOutsideCauseway } from '../../../shared/world.ts';
import '../style.css';

const START = 1000 / 0.98 + 525;
const END = 2700 / 0.98 + 525;
const ROAD_Y = 33 / 0.75 + 740;
const empty = [];

function StreamingSmoke() {
  const player = useRef<any>({ x: START, y: ROAD_Y, tx: START, ty: ROAD_Y, heading: -Math.PI / 2 });
  const obstacles = useRef<any[]>([]);
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<any>({ status: 'ready' });
  useEffect(() => {
    if (!running) return;
    let raf = 0,
      last = performance.now(),
      lastReport = 0,
      leg = 0,
      arrivedAt = 0,
      maxStep = 0;
    const errors = new Set<string>();
    const lods = new Set<string>();
    const transitions: string[] = [];
    let predictedLoad = false;
    const rates: number[] = [];
    const targets = [END, START, END];
    const frame = (time: number) => {
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      const target = targets[leg];
      const step =
        Math.sign(target - player.current.x) *
        Math.min(Math.abs(target - player.current.x), 280 * dt);
      player.current.x += step;
      player.current.tx = target;
      player.current.heading = step > 0 ? -Math.PI / 2 : Math.PI / 2;
      maxStep = Math.max(maxStep, Math.abs(step));
      if (isOutsideCauseway(player.current.x, player.current.y)) errors.add('Route left causeway');
      if (
        obstacles.current.some(
          (b) => Math.abs(player.current.x - b.x) < b.rx && Math.abs(player.current.y - b.y) < b.ry,
        )
      )
        errors.add('Road intersects a building collider');
      const host = document.querySelector<HTMLElement>('[data-stream-lod]');
      if (host?.dataset.streamLod) {
        lods.add(host.dataset.streamLod);
        if (transitions.at(-1) !== host.dataset.streamLod) transitions.push(host.dataset.streamLod);
      }
      if ((player.current.x - 525) * 0.98 < 2300 && host?.dataset.streamLoadCount === '2')
        predictedLoad = true;
      if (host?.dataset.frameRate) rates.push(Number(host.dataset.frameRate));
      const snapshot = {
        status: 'running',
        leg,
        x: Math.round(player.current.x),
        y: player.current.y,
        lod: host?.dataset.streamLod,
        observedLods: [...lods],
        lodTransitions: transitions,
        prefetchedBeforeArrival: predictedLoad,
        chunkRequests: Number(host?.dataset.streamLoadCount || 0),
        maxCoordinateStep: maxStep,
        errors: [...errors],
      };
      if (Math.abs(player.current.x - target) < 0.01) {
        if (!arrivedAt) arrivedAt = time;
        if (time - arrivedAt < 600) {
          setReport(snapshot);
          raf = requestAnimationFrame(frame);
          return;
        }
        arrivedAt = 0;
        leg++;
        if (leg === targets.length) {
          if (!lods.has('near') || !lods.has('far')) errors.add('Both LODs were not observed');
          if (!transitions.join(',').includes('far,near,far,near'))
            errors.add('Return-trip LOD sequence was not observed');
          if (!predictedLoad) errors.add('Detailed chunk was not prefetched before arrival');
          if (snapshot.chunkRequests !== 2) errors.add('Expected exactly two cached LOD requests');
          if (maxStep > 14.01) errors.add('Unexpected coordinate discontinuity');
          setReport({
            ...snapshot,
            status: errors.size ? 'failed' : 'passed',
            errors: [...errors],
            sampleFps: rates.at(-1),
          });
          return;
        }
      }
      if (time - lastReport > 300) {
        setReport(snapshot);
        lastReport = time;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running]);
  return (
    <div className="game-shell">
      <ThreeCity
        playerRef={player}
        playerName="Streaming test"
        online={empty}
        places={empty}
        jobs={empty}
        onObstacles={(value) => {
          obstacles.current = value;
        }}
        onPlace={() => {}}
        onMapMove={() => {}}
        onCombatEvent={() => {}}
        onPickup={() => {}}
        active={null}
        enteredBuildingId={null}
        cameraMode="drone"
      />
      <section
        style={{
          position: 'absolute',
          zIndex: 100,
          top: 12,
          left: 12,
          background: '#091827ed',
          color: '#d4f3ff',
          padding: 16,
          maxWidth: 360,
          fontSize: 12,
        }}
      >
        <button onClick={() => setRunning(true)} disabled={running}>
          Run crossing smoke test
        </button>
        <pre id="smoke-report" style={{ whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(report, null, 2)}
        </pre>
      </section>
    </div>
  );
}

if (import.meta.env.DEV) {
  const root = import.meta.hot?.data.root ?? createRoot(document.getElementById('root')!);
  if (import.meta.hot) import.meta.hot.data.root = root;
  root.render(<StreamingSmoke />);
}
