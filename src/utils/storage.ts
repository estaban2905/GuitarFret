/**
 * @file storage.ts
 * @description Adaptador seguro de persistencia en localStorage con tolerancia a errores de cuota o privacidad.
 */

export function readStorage(key: string): string | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function readJsonStorage<T>(key: string, validate?: (data: unknown) => data is T): T | null {
  const raw = readStorage(key);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (validate && !validate(parsed)) {
      return null;
    }
    return parsed as T;
  } catch {
    return null;
  }
}

export function writeJsonStorage<T>(key: string, value: T): boolean {
  try {
    return writeStorage(key, JSON.stringify(value));
  } catch {
    return false;
  }
}
