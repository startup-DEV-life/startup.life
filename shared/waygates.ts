/** Dev. Life travel adapted to the current Startup.life world, not a second map. */
export const WAYGATES = [
  { id: 'commons', name: 'Developer Commons', x: 571, y: 784.5, color: '#57e3c0' },
  { id: 'culture', name: 'Culture Quarter', x: 207, y: 516, color: '#efb657' },
  { id: 'market', name: 'Market Avenue', x: 935, y: 1053.5, color: '#ef86ac' },
  { id: 'campus', name: 'Campus Crossroads', x: 1299, y: 784.5, color: '#7fa7ff' },
  {
    id: 'east-arrival',
    name: 'East Island Landing',
    x: 2700 / 0.98 + 525,
    y: 784,
    color: '#67d8f1',
  },
  {
    id: 'east-gardens',
    name: 'East Island Gardens',
    x: 3150 / 0.98 + 525,
    y: 784,
    color: '#c5a1ed',
  },
  {
    id: 'veil-gate',
    name: 'Veil Gate Approach',
    x: 1728,
    y: 1010,
    color: '#f29a69',
  },
] as const;
export function findWaygate(id: unknown) {
  return typeof id === 'string' ? WAYGATES.find((gate) => gate.id === id) : undefined;
}
export function waygateSpawn(gate: (typeof WAYGATES)[number]) {
  // Along the same cleared road, outside the automatic gate trigger.
  return { x: gate.x + 45, y: gate.y };
}
