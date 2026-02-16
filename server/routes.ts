import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.greeting.get.path, async (_req, res) => {
    const greeting = await storage.getGreeting();
    res.json({ message: greeting?.message || "Hello World" });
  });

  const existing = await storage.getGreeting();
  if (!existing) {
    await storage.createGreeting({ message: "Hello World" });
  }

  return httpServer;
}
