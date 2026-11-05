export type GraphicsQuality = 'auto' | 'low' | 'balanced' | 'high';
export type ResolvedQuality = Exclude<GraphicsQuality, 'auto'>;

export const GRAPHICS_PROFILES = {
  low: { pixelRatio: 1, shadows: false, shadowSize: 512, clouds: 5, particles: 24, paintDetail: 0 },
  balanced: {
    pixelRatio: 1.25,
    shadows: true,
    shadowSize: 1024,
    clouds: 9,
    particles: 48,
    paintDetail: 0.6,
  },
  high: {
    pixelRatio: 1.75,
    shadows: true,
    shadowSize: 2048,
    clouds: 14,
    particles: 72,
    paintDetail: 1,
  },
} as const;

export function resolveGraphicsQuality(
  requested: GraphicsQuality,
  compact: boolean,
): ResolvedQuality {
  return requested === 'low' || requested === 'balanced' || requested === 'high'
    ? requested
    : compact
      ? 'low'
      : 'balanced';
}

export function readGraphicsQuality(): GraphicsQuality {
  try {
    const value = localStorage.getItem('startup-life-graphics');
    if (value === 'low' || value === 'balanced' || value === 'high') return value;
  } catch {}
  return 'auto';
}
