import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { fetchArticle, fetchArticles } from "./aura-fetch";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ── Article fetch (Aura API) ──────────────────────────────────────────

  app.post(api.articles.fetch.path, async (req, res) => {
    try {
      const input = api.articles.fetch.input.parse(req.body);
      const article = await fetchArticle(input.articleId, {
        context: input.context,
        token: input.token,
        descriptor: input.descriptor,
      });
      res.json(article);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      const message = err instanceof Error ? err.message : String(err);
      res.status(502).json({ message });
    }
  });

  app.post(api.articles.fetchBatch.path, async (req, res) => {
    try {
      const input = api.articles.fetchBatch.input.parse(req.body);
      const result = await fetchArticles(input.articleIds, input.delayMs, {
        context: input.context,
        token: input.token,
        descriptor: input.descriptor,
      });
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      const message = err instanceof Error ? err.message : String(err);
      res.status(502).json({ message });
    }
  });
  app.get(api.greeting.get.path, async (_req, res) => {
    const greeting = await storage.getGreeting();
    res.json({ message: greeting?.message || "Hello World" });
  });

  app.get(api.documents.list.path, async (_req, res) => {
    const docs = await storage.listDocuments();
    res.json(docs);
  });

  app.post(api.documents.insert.path, async (req, res) => {
    try {
      const input = api.documents.insert.input.parse(req.body);
      const doc = await storage.insertDocument(input);
      res.status(201).json(doc);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.documents.delete.path, async (req, res) => {
    await storage.deleteDocument(Number(req.params.id));
    res.status(204).send();
  });

  app.post(api.documents.query.path, async (req, res) => {
    try {
      const input = api.documents.query.input.parse(req.body);
      const results = await storage.queryDocuments(input.query, input.limit);
      res.json(results);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  const existing = await storage.getGreeting();
  if (!existing) {
    await storage.createGreeting({ message: "Hello World" });
  }

  return httpServer;
}
