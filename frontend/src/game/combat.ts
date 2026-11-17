export type EnemyKind = 'rift-hound' | 'echo-wraith' | 'gate-sentinel' | 'rift-regent';
export type RiftEnemy = {
  id: string;
  kind: EnemyKind;
  name: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  attackAt: number;
  state: 'patrol' | 'pursuit' | 'attack' | 'stagger' | 'defeated' | 'dormant';
  boss?: boolean;
};

export const RIFT_GATE = { x: 1728, y: 953 };
export const RIFT_ARENA = { x: 1600, y: 1650 };

export function createRiftEncounter(): RiftEnemy[] {
  const roster: Array<[string, EnemyKind, string, number, number, number, number, boolean?]> = [
    ['hound-01', 'rift-hound', 'Ashfang', 1485, 1600, 100, 18],
    ['wraith-01', 'echo-wraith', 'Hollow Echo', 1690, 1605, 82, 13],
    ['sentinel-01', 'gate-sentinel', 'Rift Sentinel', 1450, 1720, 150, 24],
    ['regent', 'rift-regent', 'The Veil Regent', 1640, 1740, 520, 35, true],
  ];
  return roster.map(([id, kind, name, x, y, health, damage, boss]) => ({
    id,
    kind,
    name,
    x,
    y,
    homeX: x,
    homeY: y,
    health,
    maxHealth: health,
    speed: kind === 'rift-hound' ? 40 : kind === 'rift-regent' ? 23 : 29,
    damage,
    attackAt: 0,
    state: boss ? 'dormant' : 'patrol',
    boss,
  }));
}

export function advanceEnemy(
  enemy: RiftEnemy,
  px: number,
  py: number,
  dt: number,
  now: number,
  regentUnlocked: boolean,
) {
  if (enemy.state === 'defeated' || (enemy.boss && !regentUnlocked)) return null;
  const dx = px - enemy.x,
    dy = py - enemy.y,
    distance = Math.hypot(dx, dy);
  if (distance < 310) {
    enemy.state = distance < 72 ? 'attack' : 'pursuit';
    if (distance > 58) {
      const step = Math.min(distance - 58, enemy.speed * dt);
      enemy.x += (dx / distance) * step;
      enemy.y += (dy / distance) * step;
    }
    if (distance < 72 && now >= enemy.attackAt) {
      enemy.attackAt = now + (enemy.boss ? 1500 : 1900);
      return { damage: enemy.damage, enemyId: enemy.id };
    }
  } else {
    enemy.state = 'patrol';
    const hx = enemy.homeX - enemy.x,
      hy = enemy.homeY - enemy.y,
      d = Math.hypot(hx, hy);
    if (d > 4) {
      const step = Math.min(d, enemy.speed * 0.24 * dt);
      enemy.x += (hx / d) * step;
      enemy.y += (hy / d) * step;
    }
  }
  return null;
}

export function attackEnemy(
  enemy: RiftEnemy,
  px: number,
  py: number,
  heading: number,
  kind: 'light' | 'heavy',
  regentUnlocked: boolean,
) {
  if (enemy.state === 'defeated' || (enemy.boss && !regentUnlocked)) return 0;
  const dx = enemy.x - px,
    dy = enemy.y - py,
    distance = Math.hypot(dx, dy),
    range = kind === 'heavy' ? 118 : 86;
  const forwardX = -Math.sin(heading),
    forwardY = -Math.cos(heading),
    facing = distance === 0 ? 1 : (dx / distance) * forwardX + (dy / distance) * forwardY;
  if (distance > range || facing < -0.15) return 0;
  const damage = kind === 'heavy' ? 72 : 42;
  enemy.health = Math.max(0, enemy.health - damage);
  enemy.state = enemy.health === 0 ? 'defeated' : 'stagger';
  return damage;
}

/** Single nearest hit in the aim corridor; building boxes stop the shot. */
export function firePulse(
  enemies: RiftEnemy[],
  px: number,
  py: number,
  heading: number,
  bossUnlocked: boolean,
  obstacles: Array<{ x: number; y: number; rx: number; ry: number }> = [],
) {
  const rawX = -Math.sin(heading) / 0.98,
    rawY = -Math.cos(heading) / 0.75;
  const magnitude = Math.hypot(rawX, rawY),
    fx = rawX / magnitude,
    fy = rawY / magnitude;
  const targets = enemies
    .filter((e) => e.state !== 'defeated' && (!e.boss || bossUnlocked))
    .map((enemy) => ({
      enemy,
      along: (enemy.x - px) * fx + (enemy.y - py) * fy,
      across: Math.abs((enemy.x - px) * fy - (enemy.y - py) * fx),
    }))
    .filter((e) => e.along > 0 && e.along <= 400 && e.across < (e.enemy.boss ? 30 : 22))
    .sort((a, b) => a.along - b.along);
  const hit = targets[0];
  if (!hit) return null;
  // Slab intersection against each AABB along the finite shot segment.
  for (const b of obstacles) {
    let near = 0,
      far = hit.along;
    for (const [origin, direction, center, radius] of [
      [px, fx, b.x, b.rx],
      [py, fy, b.y, b.ry],
    ]) {
      if (Math.abs(direction) < 1e-8) {
        if (Math.abs(origin - center) > radius) {
          near = Infinity;
          break;
        }
      } else {
        const a = (center - radius - origin) / direction,
          z = (center + radius - origin) / direction;
        near = Math.max(near, Math.min(a, z));
        far = Math.min(far, Math.max(a, z));
      }
    }
    if (near <= far && far > 0) return null;
  }
  const damage = Math.min(34, hit.enemy.health);
  hit.enemy.health -= damage;
  hit.enemy.state = hit.enemy.health === 0 ? 'defeated' : 'stagger';
  return { enemy: hit.enemy, damage };
}
