import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jerseysTable = sqliteTable("jerseys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  team: text("team").notNull(),
  country: text("country").notNull(),
  type: text("type").notNull(),
  price: real("price").notNull(),
  originalPrice: real("originalPrice"),
  imageUrl: text("imageUrl").notNull(),
  inStock: integer("inStock", { mode: "boolean" }).notNull().default(true),
  sizes: text("sizes").notNull().default('["S","M","L","XL","XXL"]'),
  isFeatured: integer("isFeatured", { mode: "boolean" }).notNull().default(false),
  rating: real("rating").notNull().default(4.5),
  reviewCount: integer("reviewCount").notNull().default(0),
});

export const insertJerseySchema = createInsertSchema(jerseysTable).omit({ id: true });
export type InsertJersey = z.infer<typeof insertJerseySchema>;
export type Jersey = typeof jerseysTable.$inferSelect;
