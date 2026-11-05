/** Shared logical player coordinates for the browser and multiplayer server. */
export const WORLD_BOUNDS = {
  minX: -760,
  maxX: 4900,
  minY: -750,
  maxY: 2230,
} as const;

/** Positions in ThreeCity model space, before its WORLD_SCALE transform. */
export const EAST_ISLAND = {
  x: 3150,
  z: 33,
  radiusX: 850,
  radiusZ: 720,
  bridgeStartX: 1350,
  bridgeEndX: 2310,
  bridgeHalfWidth: 34,
} as const;

/** The sea gap is traversable only on the continuous causeway. */
export function isOutsideCauseway(x: number, y: number): boolean {
  const localX = (x - 525) * 0.98;
  const localZ = (y - 740) * 0.75;
  return (
    localX > EAST_ISLAND.bridgeStartX + 100 &&
    localX < EAST_ISLAND.bridgeEndX - 10 &&
    Math.abs(localZ - EAST_ISLAND.z) > EAST_ISLAND.bridgeHalfWidth
  );
}
