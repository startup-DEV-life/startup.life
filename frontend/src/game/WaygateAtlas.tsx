import { useEffect, useRef, useState } from 'react';
import { WAYGATES } from '../../../shared/waygates.ts';
import './waygates.css';

export default function WaygateAtlas({
  playerRef,
  identity,
  disabled,
  onTravel,
  onEnterTrial,
}: {
  playerRef: { current: any };
  identity: string;
  disabled: boolean;
  onTravel: (id: string) => Promise<boolean>;
  onEnterTrial: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [near, setNear] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [runes, setRunes] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const inFlight = useRef(false),
    entered = useRef<string | null>(null);
  const key = `startup-life:dev-life:runes:v1:${identity}`;
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      setRunes(Array.isArray(saved) ? saved.filter((id) => WAYGATES.some((g) => g.id === id)) : []);
    } catch {
      setRunes([]);
    }
  }, [key]);
  const travelRef = useRef(onTravel);
  travelRef.current = onTravel;
  const travel = async (id: string) => {
    if (inFlight.current || disabled) return;
    inFlight.current = true;
    setBusy(true);
    try {
      if (await travelRef.current(id)) {
        setOpen(false);
        setMessage('Waygate travel complete.');
      } else setMessage('Travel failed. Try again when connected and outside.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const actionRef = useRef(travel);
  actionRef.current = travel;
  useEffect(() => {
    playerRef.current.inputPaused = open;
    return () => {
      playerRef.current.inputPaused = false;
    };
  }, [open, playerRef]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const p = playerRef.current;
      const closest = disabled
        ? undefined
        : WAYGATES.find((g) => Math.hypot(p.x - g.x, p.y - g.y) < 55);
      setNear(closest?.id || null);
      const trigger =
        !open && !disabled && WAYGATES.find((g) => Math.hypot(p.x - g.x, p.y - g.y) < 17);
      if (!trigger) entered.current = null;
      else if (
        entered.current !== trigger.id &&
        !inFlight.current &&
        performance.now() > (p.travelUntil || 0)
      ) {
        entered.current = trigger.id;
        const index = WAYGATES.findIndex((g) => g.id === trigger.id);
        void actionRef.current(WAYGATES[(index + 1) % WAYGATES.length].id);
      }
    }, 150);
    return () => clearInterval(timer);
  }, [disabled, open, playerRef]);
  const attune = () => {
    if (!near || runes.includes(near)) return;
    const next = [...runes, near];
    setRunes(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      setMessage('Storage unavailable; progress lasts for this session.');
    }
  };
  const attuneRef = useRef(attune);
  attuneRef.current = attune;
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target?.closest('input,textarea,select,[contenteditable="true"]') || disabled) return;
      if (event.key.toLowerCase() === 'm') {
        event.preventDefault();
        if (!event.repeat) setOpen((v) => !v);
      }
      if (event.key.toLowerCase() === 'e' && !event.repeat) attuneRef.current();
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [disabled]);
  return (
    <>
      <aside className="waygate-status" aria-label="Dev. Life expedition">
        <button onClick={() => setOpen(true)} disabled={disabled}>
          ATLAS · M · {runes.length}/7 runes
        </button>
        {near && (
          <button onClick={attune} disabled={runes.includes(near)}>
            E · {runes.includes(near) ? 'Rune attuned' : 'Attune rune'}
          </button>
        )}
        {near === 'veil-gate' && !disabled && (
          <button onClick={onEnterTrial}>Enter Shatterline trial</button>
        )}
        {busy && <span role="status">Travelling…</span>}
        {runes.length === 7 && <span>Seven-rune expedition complete</span>}
      </aside>
      {open && (
        <section
          className="waygate-shade"
          role="dialog"
          aria-modal="true"
          aria-labelledby="atlas-title"
        >
          <div className="waygate-atlas">
            <button autoFocus className="atlas-close" onClick={() => setOpen(false)}>
              Close · Esc
            </button>
            <h2 id="atlas-title">Dev. Life · World Atlas</h2>
            <p>
              One world. Seven destinations. Walk into a glowing gate to reach the next destination,
              or choose below. Attune each nearby rune with E. Progress is saved on this device.
            </p>
            <div className="waygate-list">
              {WAYGATES.map((g, i) => (
                <button key={g.id} disabled={busy || disabled} onClick={() => void travel(g.id)}>
                  <b>
                    {i + 1}. {g.name}
                  </b>
                  <span>{runes.includes(g.id) ? 'Rune attuned' : 'Rune waiting'}</span>
                </button>
              ))}
            </div>
            <p role="status">{message}</p>
          </div>
        </section>
      )}
    </>
  );
}
