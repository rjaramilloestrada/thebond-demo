"use client";

import { useEffect } from "react";
import { storage } from "@/adapters";
import { buildLiveSale, nextLiveSaleDelay, pickSaleTarget } from "@/domain/live-sales";
import { remainingSeats, ticketTypeViews } from "@/domain/selectors";
import { useHasHydrated } from "@/store/hydrate";
import { useDemoStore } from "@/store/demo-store";

/**
 * Ventas en vivo simuladas (interruptor `simulateLiveSales`, brief 6.6): cada
 * 6 a 10 s crea una venta semilla de 1 entrada vía adapter y el contador baja
 * solo. Se detiene al llegar a 0. No dibuja nada.
 */
export function LiveSalesSimulator({ slug }: { slug: string }) {
  const hydrated = useHasHydrated();
  const enabled = useDemoStore((s) => s.simulateLiveSales);

  useEffect(() => {
    if (!hydrated || !enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const tick = async () => {
      const edition = await storage.editions.getBySlug(slug);
      if (cancelled || !edition || edition.capacity === null) return;
      const [orders, ticketTypes] = await Promise.all([storage.orders.list(), storage.ticketTypes.list()]);
      if (cancelled) return;
      if ((remainingSeats(edition, orders) ?? 0) <= 0) return; // llegó a 0: se detiene
      const target = pickSaleTarget(ticketTypeViews(ticketTypes, orders, edition.id));
      if (!target) return;
      const seq = orders.filter((o) => o.id.startsWith("ord-live-")).length + 1;
      const sale = buildLiveSale({ edition, view: target, seq });
      if (sale) {
        await storage.orders.save(sale.order);
        await storage.tickets.save(sale.ticket);
      }
      if (!cancelled) timer = setTimeout(tick, nextLiveSaleDelay());
    };

    timer = setTimeout(tick, nextLiveSaleDelay());
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [hydrated, enabled, slug]);

  return null;
}
