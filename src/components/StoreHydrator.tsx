"use client";

import { useEffect } from "react";
import { hydrateStores } from "@/store/hydrate";

/** Aplica los datos persistidos tras el primer render (evita desajustes SSR/cliente). */
export function StoreHydrator() {
  useEffect(() => {
    void hydrateStores();
  }, []);
  return null;
}
