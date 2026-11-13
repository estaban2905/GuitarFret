/**
 * @file env.ts
 * @description Validación tipada de variables públicas de entorno para Vite.
 */

interface ClientEnvConfig {
  appName: string;
  defaultBpm: number;
}

function parsePositiveInt(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed >= 40 && parsed <= 240) {
      return parsed;
    }
  }
  return fallback;
}

const rawEnv = (import.meta as unknown as { env?: Record<string, unknown> }).env ?? {};

export const clientEnv: ClientEnvConfig = {
  appName:
    typeof rawEnv.VITE_APP_NAME === 'string' && rawEnv.VITE_APP_NAME.trim().length > 0
      ? rawEnv.VITE_APP_NAME.trim()
      : 'GuitarFret',
  defaultBpm: parsePositiveInt(rawEnv.VITE_DEFAULT_BPM, 120)
};
