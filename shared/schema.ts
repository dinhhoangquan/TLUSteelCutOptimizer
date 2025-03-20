import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
  verificationToken: text("verification_token"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: text("reset_password_expires"),
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
  email: true,
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

// Authentication schemas
export const SignUpSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

export const VerifyEmailSchema = z.object({
  token: z.string()
});

export const ResetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address")
});

export const SetNewPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export type SignUpData = z.infer<typeof SignUpSchema>;
export type LoginData = z.infer<typeof LoginSchema>;
export type VerifyEmailData = z.infer<typeof VerifyEmailSchema>;
export type ResetPasswordData = z.infer<typeof ResetPasswordSchema>;
export type SetNewPasswordData = z.infer<typeof SetNewPasswordSchema>;
