export type Obstacle = { x: number; y: number; rx: number; ry: number };
/** Input x=right, y=back; yaw zero looks down -Z, matching the avatar. */
export function cameraMovement(x: number, y: number, yaw: number) {
  const length = Math.hypot(x, y);
  if (!length) return { x: 0, y: 0 };
  const magnitude = Math.min(1, length);
  const worldX = (x * Math.cos(yaw) + y * Math.sin(yaw)) / length;
  const worldY = (-x * Math.sin(yaw) + y * Math.cos(yaw)) / length;
  // Logical map axes have different rendering scales.
  const lx = worldX / 0.98,
    ly = worldY / 0.75;
  const n = Math.hypot(lx, ly);
  return { x: (lx / n) * magnitude, y: (ly / n) * magnitude };
}
/** Small swept steps prevent tunnelling; separate axes allow wall sliding. */
export function sweepMovement(
  x: number,
  y: number,
  dx: number,
  dy: number,
  obstacles: Obstacle[],
  blocked: (x: number, y: number) => boolean,
  ignored?: Obstacle | null,
) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 4));
  const solid = (px: number, py: number) =>
    blocked(px, py) ||
    obstacles.some(
      (b) => b !== ignored && Math.abs(px - b.x) < b.rx + 3 && Math.abs(py - b.y) < b.ry + 3,
    );
  for (let step = 0; step < steps; step++) {
    const nx = x + dx / steps;
    if (!solid(nx, y)) x = nx;
    const ny = y + dy / steps;
    if (!solid(x, ny)) y = ny;
  }
  return { x, y };
}
