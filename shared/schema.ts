import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
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

// ---------------------------------------------------------------------------
// Salesforce Help Documents
// ---------------------------------------------------------------------------

export const helpDocuments = pgTable("help_documents", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHelpDocumentSchema = createInsertSchema(helpDocuments).pick({
  fileName: true,
  content: true,
});

export type HelpDocument = typeof helpDocuments.$inferSelect;
export type InsertHelpDocument = z.infer<typeof insertHelpDocumentSchema>;
