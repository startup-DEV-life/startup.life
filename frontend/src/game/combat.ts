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
