import type { StateStorage } from "zustand/middleware";

/**
 * Wrapper de localStorage para el demo (brief 5: "envuelto en try/catch").
 *
 * Si el navegador bloquea el almacenamiento (modo privado de iOS, cookies
 * bloqueadas, vistas previas, SSR), cada operación falla en silencio y el demo
 * sigue funcionando con un respaldo en memoria. Nunca lanza.
 */
export interface SafeStorage extends StateStorage {
  /** true mientras se esté usando localStorage real */
  isPersistent(): boolean;
}

export function createSafeStorage(): SafeStorage {
  const memory = new Map<string, string>();
  let persistent = true;

  function local(): Storage | null {
    if (!persistent) return null;
    try {
      if (typeof window === "undefined") {
        persistent = false;
        return null;
      }
      return window.localStorage;
    } catch {
      persistent = false;
      return null;
    }
  }

  return {
    getItem(name) {
      const ls = local();
      if (ls) {
        try {
          return ls.getItem(name);
        } catch {
          persistent = false;
        }
      }
      return memory.get(name) ?? null;
    },
    setItem(name, value) {
      memory.set(name, value);
      const ls = local();
      if (!ls) return;
      try {
        ls.setItem(name, value);
      } catch {
        persistent = false;
      }
    },
    removeItem(name) {
      memory.delete(name);
      const ls = local();
      if (!ls) return;
      try {
        ls.removeItem(name);
      } catch {
        persistent = false;
      }
    },
    isPersistent() {
      return persistent;
    },
  };
}

/** Instancia compartida por todos los stores del demo */
export const safeStorage = createSafeStorage();
