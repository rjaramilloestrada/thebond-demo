import { afterEach, describe, expect, it, vi } from "vitest";
import { createSafeStorage } from "./safe-storage";

afterEach(() => vi.unstubAllGlobals());

describe("safe-storage", () => {
  it("cae a memoria cuando no hay window (SSR)", () => {
    const s = createSafeStorage();
    s.setItem("a", "1");
    expect(s.getItem("a")).toBe("1");
    s.removeItem("a");
    expect(s.getItem("a")).toBeNull();
    expect(s.isPersistent()).toBe(false);
  });

  it("no lanza si acceder a localStorage lanza (modo privado)", () => {
    vi.stubGlobal("window", {
      get localStorage(): Storage {
        throw new DOMException("denegado", "SecurityError");
      },
    });
    const s = createSafeStorage();
    expect(() => s.setItem("k", "v")).not.toThrow();
    expect(s.getItem("k")).toBe("v");
    expect(s.isPersistent()).toBe(false);
  });

  it("no lanza si setItem falla por cuota y conserva el valor en memoria", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: () => {
          throw new DOMException("lleno", "QuotaExceededError");
        },
        removeItem: (k: string) => void store.delete(k),
      },
    });
    const s = createSafeStorage();
    expect(() => s.setItem("k", "v")).not.toThrow();
    expect(s.getItem("k")).toBe("v");
  });

  it("usa localStorage cuando funciona", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    });
    const s = createSafeStorage();
    s.setItem("k", "v");
    expect(store.get("k")).toBe("v");
    expect(s.isPersistent()).toBe(true);
  });
});
