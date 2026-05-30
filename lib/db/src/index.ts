import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type { InsertJersey, Jersey } from "./schema/jerseys";
export type { InsertOrder, Order } from "./schema/orders";
export type { InsertOtp, Otp } from "./schema/otp";
export * from "./schema";

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}
