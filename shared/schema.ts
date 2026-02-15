import { pgTable, text, serial, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const greetings = pgTable("greetings", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
});

export const insertGreetingSchema = createInsertSchema(greetings).pick({
  message: true,
});

export type Greeting = typeof greetings.$inferSelect;
export type InsertGreeting = z.infer<typeof insertGreetingSchema>;

export interface Document {
  id: number;
  content: string;
  metadata: Record<string, unknown>;
  embedding: number[] | null;
  created_at: string | null;
}

export interface InsertDocument {
  content: string;
  metadata?: Record<string, unknown>;
}

export interface QueryResult {
  id: number;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}
