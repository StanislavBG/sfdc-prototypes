import { db } from "./db";
import { greetings, type InsertGreeting, type Greeting } from "@shared/schema";

export interface IStorage {
  getGreeting(): Promise<Greeting | undefined>;
  createGreeting(greeting: InsertGreeting): Promise<Greeting>;
}

export class DatabaseStorage implements IStorage {
  async getGreeting(): Promise<Greeting | undefined> {
    const allGreetings = await db.select().from(greetings);
    return allGreetings[0];
  }

  async createGreeting(insertGreeting: InsertGreeting): Promise<Greeting> {
    const [greeting] = await db.insert(greetings).values(insertGreeting).returning();
    return greeting;
  }
}

export const storage = new DatabaseStorage();
