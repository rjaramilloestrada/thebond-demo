import { describe, expect, it } from "vitest";
import {
  applyCoupon,
  computeTotals,
  couponDiscountCents,
  formatMoney,
  getActiveStage,
  getNextStage,
  getStageStatuses,
} from "./pricing";
import type { Coupon, OrderLine, PriceStage } from "./types";

const stages: PriceStage[] = [
  { key: "preventa", label: "Preventa", amountCents: 1000, isExample: true, quota: 10, endsAt: null },
  { key: "general", label: "General", amountCents: 1500, isExample: true, quota: 20, endsAt: null },
  { key: "last-call", label: "Last call", amountCents: 2000, isExample: true, quota: 10, endsAt: null },
];

describe("etapas de precio", () => {
  it("la primera etapa está activa sin ventas y las demás son próximas", () => {
    const s = getStageStatuses(stages, 0);
    expect(s.map((x) => x.status)).toEqual(["active", "upcoming", "upcoming"]);
  });

  it("avanza de etapa cuando se agota la cuota acumulada", () => {
    expect(getActiveStage({ stages }, 9)?.key).toBe("preventa");
    expect(getActiveStage({ stages }, 10)?.key).toBe("general");
    expect(getActiveStage({ stages }, 29)?.key).toBe("general");
    expect(getActiveStage({ stages }, 30)?.key).toBe("last-call");
    expect(getStageStatuses(stages, 12).map((x) => x.status)).toEqual(["past", "active", "upcoming"]);
  });

  it("devuelve null cuando todas las etapas se agotaron", () => {
    expect(getActiveStage({ stages }, 40)).toBeNull();
    expect(getStageStatuses(stages, 40).every((x) => x.status === "past")).toBe(true);
  });

  it("expone la siguiente etapa para mostrarla tachada o 'próximamente'", () => {
    expect(getNextStage({ stages }, 0)?.key).toBe("general");
    expect(getNextStage({ stages }, 35)).toBeNull();
  });

  it("una etapa vence por fecha aunque queden cupos", () => {
    const dated: PriceStage[] = [
      { ...stages[0], endsAt: "2026-11-10T00:00:00-05:00" },
      stages[1],
      stages[2],
    ];
    expect(getActiveStage({ stages: dated }, 0, new Date("2026-11-09T12:00:00-05:00"))?.key).toBe("preventa");
    expect(getActiveStage({ stages: dated }, 0, new Date("2026-11-11T12:00:00-05:00"))?.key).toBe("general");
  });

  it("una etapa sin cuota nunca se agota por ventas", () => {
    const open: PriceStage[] = [{ ...stages[0], quota: null }, stages[1]];
    expect(getActiveStage({ stages: open }, 9999)?.key).toBe("preventa");
  });
});

describe("dinero", () => {
  it("los montos de ejemplo se muestran como $XX", () => {
    expect(formatMoney(1500, { isExample: true })).toBe("$XX");
  });
  it("formatea centavos en dólares", () => {
    expect(formatMoney(2000)).toContain("20");
    expect(formatMoney(2050)).toContain("20,50");
  });
});

const bond10: Coupon = {
  id: "c1",
  code: "BOND10",
  kind: "percent",
  value: 10,
  maxUses: null,
  usedCount: 0,
  validFrom: null,
  validUntil: null,
  active: true,
  editionId: null,
};

describe("cupones", () => {
  it("BOND10 descuenta 10 %", () => {
    const r = applyCoupon({ code: "BOND10", coupons: [bond10], subtotalCents: 5000 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.discountCents).toBe(500);
  });

  it("no distingue mayúsculas ni espacios", () => {
    const r = applyCoupon({ code: "  bond10 ", coupons: [bond10], subtotalCents: 3000 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.discountCents).toBe(300);
  });

  it("un cupón inválido da un error claro", () => {
    const r = applyCoupon({ code: "NOEXISTE", coupons: [bond10], subtotalCents: 5000 });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("not_found");
      expect(r.message).toMatch(/no existe/i);
    }
  });

  it("código vacío", () => {
    const r = applyCoupon({ code: "   ", coupons: [bond10], subtotalCents: 5000 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("empty");
  });

  it("rechaza cupones agotados, vencidos, futuros, inactivos y de otra edición", () => {
    const base = { code: "X", coupons: [] as Coupon[], subtotalCents: 1000 };
    const check = (c: Partial<Coupon>, now?: Date, editionId?: string) =>
      applyCoupon({ ...base, code: "BOND10", coupons: [{ ...bond10, ...c }], now, editionId });
    const reason = (r: ReturnType<typeof check>) => (r.ok ? "ok" : r.reason);

    expect(reason(check({ maxUses: 3, usedCount: 3 }))).toBe("exhausted");
    expect(reason(check({ validUntil: "2026-01-01T00:00:00-05:00" }, new Date("2026-06-01")))).toBe("expired");
    expect(reason(check({ validFrom: "2027-01-01T00:00:00-05:00" }, new Date("2026-06-01")))).toBe("not_started");
    expect(reason(check({ active: false }))).toBe("inactive");
    expect(reason(check({ editionId: "ed-a" }, undefined, "ed-b"))).toBe("wrong_edition");
    expect(reason(check({ editionId: "ed-a" }, undefined, "ed-a"))).toBe("ok");
  });

  it("el descuento por monto nunca supera el subtotal", () => {
    const amount: Coupon = { ...bond10, kind: "amount", value: 9000 };
    expect(couponDiscountCents(amount, 5000)).toBe(5000);
  });
});

describe("totales", () => {
  const lines: OrderLine[] = [
    { ticketTypeId: "a", stageKey: "preventa", unitCents: 1000, quantity: 2, isExample: true },
    { ticketTypeId: "b", stageKey: "preventa", unitCents: 2000, quantity: 1, isExample: true },
  ];
  it("suma líneas y resta descuento", () => {
    const t = computeTotals(lines, 400);
    expect(t.subtotalCents).toBe(4000);
    expect(t.discountCents).toBe(400);
    expect(t.totalCents).toBe(3600);
    expect(t.quantity).toBe(3);
    expect(t.isExample).toBe(true);
  });
});
