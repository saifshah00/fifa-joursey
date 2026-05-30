import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const otpTable = sqliteTable("otp_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  code: text("code").notNull(),
  token: text("token"),
  used: integer("used", { mode: "boolean" }).notNull().default(false),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const insertOtpSchema = createInsertSchema(otpTable).omit({ id: true, createdAt: true });
export type InsertOtp = z.infer<typeof insertOtpSchema>;
export type Otp = typeof otpTable.$inferSelect;
