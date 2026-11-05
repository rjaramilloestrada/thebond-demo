import type { Entities, EntityKey, ID } from "@/domain/types";
import { useDbStore } from "@/store/db-store";
import type { CouponRepository, EditionRepository, Repository, StorageAdapter } from "../types";

/**
 * Repositorio genérico sobre el store local. En el demo el acceso a datos es
 * instantáneo; la latencia de 600–1 200 ms se reserva para pagos, correo y
 * facturas (donde en producción hay red).
 */
function makeRepo<K extends EntityKey>(key: K): Repository<Entities[K]> {
  type T = Entities[K];
  const table = () => useDbStore.getState()[key] as Record<ID, T>;
  return {
    async list() {
      return Object.values(table());
    },
    async get(id) {
      return table()[id];
    },
    async save(item) {
      useDbStore.getState().put(key, item);
      return item;
    },
    async remove(id) {
      useDbStore.getState().remove(key, id);
    },
  };
}

export class MockStorageAdapter implements StorageAdapter {
  editions: EditionRepository = {
    ...makeRepo("editions"),
    async getBySlug(slug) {
      return Object.values(useDbStore.getState().editions).find((e) => e.slug === slug);
    },
  };
  brands = makeRepo("brands");
  ticketTypes = makeRepo("ticketTypes");
  orders = makeRepo("orders");
  tickets = makeRepo("tickets");
  coupons: CouponRepository = {
    ...makeRepo("coupons"),
    async findByCode(code) {
      const normalized = code.trim().toUpperCase();
      return Object.values(useDbStore.getState().coupons).find((c) => c.code.toUpperCase() === normalized);
    },
  };
  waitlist = makeRepo("waitlist");
  attendeeFields = makeRepo("attendeeFields");
  checkIns = makeRepo("checkIns");
  invoices = makeRepo("invoices");
  emails = makeRepo("emails");

  async reset(): Promise<void> {
    useDbStore.getState().resetDemo();
  }
}
