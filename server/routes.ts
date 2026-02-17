import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { parseMhtml } from "./mhtml-parser";
import { z } from "zod";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Bootstrap
  await storage.init();
  const existing = await storage.getGreeting();
  if (!existing) {
    await storage.createGreeting({ message: "Hello World" });
  }

  app.get(api.greeting.get.path, async (_req, res) => {
    const greeting = await storage.getGreeting();
    res.json({ message: greeting?.message || "Hello World" });
  });

  // =========================================================================
  // Help Documents
  // =========================================================================

  /** Upload an MHTML file — parse, chunk, embed, store. */
  app.post(api.helpDocs.upload.path, upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No file uploaded" });

      const { title, content } = parseMhtml(file.buffer);
      const fileName = file.originalname || title;
      const { document, chunksStored } = await storage.insertHelpDocument(fileName, content);

      res.status(201).json({
        id: document.id,
        fileName: document.fileName,
        contentLength: content.length,
        chunksStored,
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      res.status(500).json({ message: err.message || "Upload failed" });
    }
  });

  /** List all help documents. */
  app.get(api.helpDocs.list.path, async (_req, res) => {
    try {
      const docs = await storage.listHelpDocuments();
      res.json(docs);
    } catch (err) {
      console.error("List help documents error:", err);
      res.json([]);
    }
  });

  /** Get a single help document (with full content for preview). */
  app.get(api.helpDocs.get.path, async (req, res) => {
    try {
      const doc = await storage.getHelpDocument(Number(req.params.id));
      if (!doc) return res.status(404).json({ message: "Not found" });
      res.json(doc);
    } catch (err) {
      console.error("Get help document error:", err);
      res.status(500).json({ message: "Failed to load document" });
    }
  });

  /** Delete a help document and its chunks. */
  app.delete(api.helpDocs.delete.path, async (req, res) => {
    try {
      await storage.deleteHelpDocument(Number(req.params.id));
      res.json({ deleted: true });
    } catch (err) {
      console.error("Delete help document error:", err);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  /** Semantic search across help documents. */
  app.post(api.helpDocs.search.path, async (req, res) => {
    try {
      const input = api.helpDocs.search.input.parse(req.body);
      const results = await storage.searchHelpDocuments(input.query, input.limit);
      res.json(results);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  return httpServer;
}
