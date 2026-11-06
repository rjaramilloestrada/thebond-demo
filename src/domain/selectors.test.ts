import { describe, expect, it } from "vitest";
import { seed } from "@/seed/seed";
import {
  buildEditionViewModel,
  holdsSeats,
  isSoldOut,
  lowestActivePrice,
  nextEdition,
  pastEditions,
  remainingSeats,
  soldCount,
  ticketTypeViews,
} from "./selectors";
import { buildLiveSale, nextLiveSaleDelay, pickSaleTarget } from "./live-sales";
import type { Edition, Order } from "./types";

const NOW = new Date("2026-11-05T12:00:00-05:00");
const data = seed(NOW);
const ed1 = data.editions["ed-001"];
const ed2 = data.editions["ed-002"];

function order(partial: Partial<Order> & Pick<Order, "id" | "editionId">): Order {
  const base = Object.values(data.orders).find((o) => o.editionId === partial.editionId) as Order;
  return { ...base, ...partial };
}

describe("soldCount", () => {
  it("suma las entradas de órdenes pagadas de la edición", () => {
    expect(soldCount(data.orders, "ed-002", { now: NOW })).toBe(7);
    expect(soldCount(data.orders, "ed-001", { now: NOW })).toBe(8);
  });

  it("filtra por tipo de entrada", () => {
    expect(soldCount(data.orders, "ed-002", { ticketTypeId: "tt-002-a", now: NOW })).toBe(4);
    expect(soldCount(data.orders, "ed-002", { ticketTypeId: "tt-002-b", now: NOW })).toBe(3);
  });

  it("ignora canceladas, reembolsadas y reservas vencidas; cuenta reservas vigentes", () => {
    const base = Object.values(data.orders).find((o) => o.editionId === "ed-002") as Order;
    const qty = base.lines[0].quantity;
    const mk = (id: string, patch: Partial<Order>) => order({ id, editionId: "ed-002", lines: base.lines, ...patch });
    const orders = [
      mk("c", { status: "cancelled" }),
      mk("r", { status: "refunded" }),
      mk("e", { status: "expired" }),
      mk("rv-old", { status: "reserved", reservationExpiresAt: "2026-11-05T11:00:00-05:00" }),
      mk("rv-live", { status: "reserved", reservationExpiresAt: "2026-11-05T12:05:00-05:00" }),
      mk("p", { status: "paid" }),
    ];
    expect(soldCount(orders, "ed-002", { now: NOW })).toBe(qty * 2);
    expect(holdsSeats(orders[3], NOW)).toBe(false);
    expect(holdsSeats(orders[4], NOW)).toBe(true);
  });
});

describe("remainingSeats", () => {
  it("resta las vendidas del aforo", () => {
    expect(remainingSeats(ed2, data.orders, NOW)).toBe(53);
  });
  it("es null si el aforo es pendiente", () => {
    expect(remainingSeats(ed1, data.orders, NOW)).toBeNull();
  });
  it("nunca baja de 0", () => {
    expect(remainingSeats({ id: "ed-002", capacity: 3 }, data.orders, NOW)).toBe(0);
  });
});

describe("isSoldOut", () => {
  it("la ed. 001 está agotada (soldOut) y la 002 no", () => {
    expect(isSoldOut(ed1, data.orders, {}, NOW)).toBe(true);
    expect(isSoldOut(ed2, data.orders, {}, NOW)).toBe(false);
  });
  it("forceSoldOut agota la edición", () => {
    expect(isSoldOut(ed2, data.orders, { forceSoldOut: true }, NOW)).toBe(true);
  });
  it("se agota cuando no quedan cupos", () => {
    expect(isSoldOut({ ...ed2, capacity: 7 }, data.orders, {}, NOW)).toBe(true);
  });
});

describe("nextEdition y pastEditions", () => {
  it("la próxima es la 002 y la pasada es la 001", () => {
    expect(nextEdition(data.editions)?.slug).toBe("the-power-hour");
    expect(pastEditions(data.editions).map((e) => e.slug)).toEqual(["the-first-experience"]);
  });
  it("ignora borradores", () => {
    const draft: Edition = { ...ed2, id: "ed-003", slug: "borrador", number: "003", status: "draft" };
    expect(nextEdition([draft])).toBeUndefined();
    expect(nextEdition([draft, ed2])?.id).toBe("ed-002");
  });
  it("entre varias próximas elige la de fecha más cercana; sin fecha va al final", () => {
    const a: Edition = { ...ed2, id: "a", number: "003", startsAt: "2026-12-10T10:00:00-05:00" };
    const b: Edition = { ...ed2, id: "b", number: "004", startsAt: "2026-12-01T10:00:00-05:00" };
    expect(nextEdition([ed2, a, b])?.id).toBe("b");
    expect(nextEdition([ed2, a])?.id).toBe("a");
  });
  it("ordena las pasadas de más reciente a más antigua", () => {
    const old: Edition = { ...ed1, id: "x", number: "000", slug: "x" };
    expect(pastEditions([old, ed1]).map((e) => e.number)).toEqual(["001", "000"]);
  });
});

describe("etapas por tipo de entrada", () => {
  it("la ed. 002 arranca en Preventa en los dos tipos", () => {
    const views = ticketTypeViews(data.ticketTypes, data.orders, "ed-002", NOW);
    expect(views).toHaveLength(2);
    expect(views.map((v) => v.activeStage?.key)).toEqual(["preventa", "preventa"]);
    expect(views[0].stages.map((s) => s.status)).toEqual(["active", "upcoming", "upcoming"]);
  });
  it("precio desde: el menor de las etapas activas", () => {
    const views = ticketTypeViews(data.ticketTypes, data.orders, "ed-002", NOW);
    expect(lowestActivePrice(views)).toMatchObject({ amountCents: 1000, isExample: true });
    expect(lowestActivePrice([])).toBeNull();
  });
});

describe("buildEditionViewModel", () => {
  it("arma la edición actual con marcas, tipos y cupos", () => {
    const vm = buildEditionViewModel(data, "the-power-hour", { now: NOW });
    expect(vm?.edition.number).toBe("002");
    expect(vm?.brands.map((b) => b.id)).toEqual(["br-fit101", "br-pend-01", "br-pend-02"]);
    expect(vm?.ticketTypes).toHaveLength(2);
    expect(vm?.sold).toBe(7);
    expect(vm?.remaining).toBe(53);
    expect(vm?.soldOut).toBe(false);
    expect(vm?.soldByType).toEqual({ "tt-002-a": 4, "tt-002-b": 3 });
  });
  it("respeta forceSoldOut y devuelve undefined para slugs desconocidos", () => {
    expect(buildEditionViewModel(data, "the-power-hour", { forceSoldOut: true, now: NOW })?.soldOut).toBe(true);
    expect(buildEditionViewModel(data, "no-existe", { now: NOW })).toBeUndefined();
  });
});

describe("ventas en vivo simuladas", () => {
  it("el intervalo cae entre 6 y 10 s", () => {
    expect(nextLiveSaleDelay(() => 0)).toBe(6000);
    expect(nextLiveSaleDelay(() => 1)).toBe(10000);
  });
  it("construye una orden pagada de 1 entrada que baja el contador", () => {
    const views = ticketTypeViews(data.ticketTypes, data.orders, "ed-002", NOW);
    const target = pickSaleTarget(views, () => 0);
    expect(target?.ticketType.id).toBe("tt-002-a");
    const sale = buildLiveSale({ edition: ed2, view: target!, seq: 1, now: NOW });
    expect(sale?.order.status).toBe("paid");
    expect(sale?.order.isSeed).toBe(true);
    expect(sale?.ticket.orderId).toBe(sale?.order.id);
    const after = [...Object.values(data.orders), sale!.order];
    expect(remainingSeats(ed2, after, NOW)).toBe(52);
  });
  it("no hay venta si todas las etapas están agotadas", () => {
    expect(pickSaleTarget([])).toBeUndefined();
  });
});
