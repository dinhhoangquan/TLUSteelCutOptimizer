import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const steelItems = pgTable("steel_items", {
  id: serial("id").primaryKey(),
  length: integer("length").notNull(),
  quantity: integer("quantity").notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const optimizationResults = pgTable("optimization_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  patterns: jsonb("patterns").notNull(),
  totalMaterial: integer("total_material").notNull(),
  totalWaste: integer("total_waste").notNull(),
  efficiency: text("efficiency").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSteelItemSchema = createInsertSchema(steelItems).pick({
  length: true,
  quantity: true,
  userId: true,
});

export const insertOptimizationResultSchema = createInsertSchema(optimizationResults).pick({
  userId: true,
  patterns: true,
  totalMaterial: true,
  totalWaste: true,
  efficiency: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSteelItem = z.infer<typeof insertSteelItemSchema>;
export type SteelItem = typeof steelItems.$inferSelect;

export type InsertOptimizationResult = z.infer<typeof insertOptimizationResultSchema>;
export type OptimizationResult = typeof optimizationResults.$inferSelect;

export const SteelItemSchema = z.object({
  length: z.number().min(1, "Length must be greater than 0"),
  quantity: z.number().min(1, "Quantity must be greater than 0"),
});

export const SteelItemsSchema = z.array(SteelItemSchema);

export const OptimizationPatternSchema = z.object({
  pattern: z.string(),
  cuttingLayout: z.array(z.object({
    length: z.number(),
    type: z.string(),
  })),
  waste: z.object({
    amount: z.number(),
    percentage: z.number(),
  }),
  quantity: z.number(),
});

export const OptimizationResultSchema = z.object({
  patterns: z.array(OptimizationPatternSchema),
  summary: z.object({
    totalMaterial: z.number(),
    totalWaste: z.number(),
    efficiency: z.number(),
  }),
});

export type OptimizationPattern = z.infer<typeof OptimizationPatternSchema>;
export type OptimizationResultData = z.infer<typeof OptimizationResultSchema>;
