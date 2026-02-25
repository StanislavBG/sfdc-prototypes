import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";
import { storage, chunkText } from "./storage";
import { api } from "@shared/routes";
import { parseMhtml } from "./mhtml-parser";
import { generateEmbedding } from "./embeddings";
import { pool } from "./db";
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
      const { document, chunksStored, totalChunks, errors } = await storage.insertHelpDocument(fileName, content);

      const response: Record<string, unknown> = {
        id: document.id,
        fileName: document.fileName,
        contentLength: content.length,
        chunksStored,
        totalChunks,
      };
      if (errors.length > 0) {
        response.warnings = errors;
      }
      res.status(201).json(response);
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

  /** Re-process a help document — re-chunk and re-embed. */
  app.post(api.helpDocs.reprocess.path, async (req, res) => {
    try {
      const doc = await storage.getHelpDocument(Number(req.params.id));
      if (!doc) return res.status(404).json({ message: "Document not found" });
      const result = await storage.reprocessHelpDocument(Number(req.params.id));
      const response: Record<string, unknown> = {
        ...result,
      };
      if (result.errors.length > 0) {
        response.warnings = result.errors;
      }
      res.json(response);
    } catch (err: any) {
      console.error("Reprocess error:", err);
      res.status(500).json({ message: err.message || "Reprocess failed" });
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

  /** Diagnose: upload a file and return step-by-step diagnostics without storing. */
  app.post(api.helpDocs.diagnose.path, upload.single("file"), async (req, res) => {
    const steps: { step: string; status: "ok" | "error"; detail: string }[] = [];

    try {
      // Step 1: Check environment
      const hasKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
      steps.push({
        step: "GEMINI_API_KEY",
        status: hasKey ? "ok" : "error",
        detail: hasKey ? "API key is set" : "No GEMINI_API_KEY or GOOGLE_API_KEY found in env",
      });

      // Step 2: Check database connection
      try {
        await pool.query("SELECT 1");
        steps.push({ step: "Database connection", status: "ok", detail: "Connected successfully" });
      } catch (e: any) {
        steps.push({ step: "Database connection", status: "error", detail: e.message });
        return res.json({ steps });
      }

      // Step 3: Check pgvector extension
      try {
        const ext = await pool.query("SELECT extname FROM pg_extension WHERE extname = 'vector'");
        if (ext.rows.length > 0) {
          steps.push({ step: "pgvector extension", status: "ok", detail: "Extension installed" });
        } else {
          steps.push({ step: "pgvector extension", status: "error", detail: "Extension not found — run CREATE EXTENSION vector" });
        }
      } catch (e: any) {
        steps.push({ step: "pgvector extension", status: "error", detail: e.message });
      }

      // Step 4: Check documents table
      try {
        const tbl = await pool.query(
          "SELECT table_name FROM information_schema.tables WHERE table_name = 'documents'"
        );
        if (tbl.rows.length > 0) {
          steps.push({ step: "documents table", status: "ok", detail: "Table exists" });
        } else {
          steps.push({ step: "documents table", status: "error", detail: "Table does not exist" });
        }
      } catch (e: any) {
        steps.push({ step: "documents table", status: "error", detail: e.message });
      }

      // Step 5: Parse uploaded file (if provided)
      const file = req.file;
      if (!file) {
        steps.push({ step: "File upload", status: "error", detail: "No file provided — upload an MHTML file to test the full pipeline" });
        return res.json({ steps });
      }

      steps.push({ step: "File upload", status: "ok", detail: `${file.originalname} (${file.size} bytes)` });

      let content = "";
      let title = "";
      try {
        const parsed = parseMhtml(file.buffer);
        title = parsed.title;
        content = parsed.content;
        steps.push({
          step: "MHTML parsing",
          status: content.length > 0 ? "ok" : "error",
          detail: `Title: "${title}" | Content length: ${content.length} chars${content.length === 0 ? " — parser returned empty content" : ""}`,
        });
      } catch (e: any) {
        steps.push({ step: "MHTML parsing", status: "error", detail: e.message });
        return res.json({ steps });
      }

      // Step 6: Chunking
      const chunks = chunkText(content);
      steps.push({
        step: "Chunking",
        status: "ok",
        detail: `${chunks.length} chunk(s) generated (max 1500 chars, 200 overlap) | First chunk: ${chunks[0]?.length || 0} chars`,
      });

      // Step 7: Test embedding on first chunk
      try {
        const embedding = await generateEmbedding(chunks[0]);
        const isZero = embedding.every((v) => v === 0);
        steps.push({
          step: "Embedding (chunk 0)",
          status: isZero && hasKey ? "error" : "ok",
          detail: `Vector dimension: ${embedding.length} | Zero vector: ${isZero}${isZero && hasKey ? " — API key set but embedding returned zeros" : ""}`,
        });
      } catch (e: any) {
        steps.push({ step: "Embedding (chunk 0)", status: "error", detail: e.message });
      }

      // Step 8: Test vector INSERT (dry run with rollback)
      try {
        await pool.query("BEGIN");
        const testEmbed = new Array(768).fill(0);
        await pool.query(
          `INSERT INTO documents (content, metadata, embedding) VALUES ($1, $2, $3::vector)`,
          [
            "diagnostic test",
            JSON.stringify({ type: "diagnostic_test" }),
            `[${testEmbed.join(",")}]`,
          ]
        );
        await pool.query("ROLLBACK");
        steps.push({ step: "Vector INSERT", status: "ok", detail: "Test insert succeeded (rolled back)" });
      } catch (e: any) {
        try { await pool.query("ROLLBACK"); } catch { /* ignore */ }
        steps.push({ step: "Vector INSERT", status: "error", detail: e.message });
      }

      return res.json({ steps, contentPreview: content.slice(0, 500) });
    } catch (err: any) {
      steps.push({ step: "Unexpected error", status: "error", detail: err.message });
      return res.json({ steps });
    }
  });

  /** Re-publish: re-chunk and re-embed an existing document. */
  app.post(api.helpDocs.republish.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const doc = await storage.getHelpDocument(id);
      if (!doc) return res.status(404).json({ message: "Document not found" });

      // Delete old chunks
      try {
        await pool.query(
          `DELETE FROM documents WHERE metadata->>'document_id' = $1 AND metadata->>'type' = 'salesforce_help'`,
          [String(id)]
        );
      } catch { /* table might not exist */ }

      // Re-chunk and re-embed
      const chunks = chunkText(doc.content);
      let stored = 0;
      const errors: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        try {
          const embedding = await generateEmbedding(chunks[i]);
          const vectorLiteral = `[${embedding.join(",")}]`;
          await pool.query(
            `INSERT INTO documents (content, metadata, embedding)
             VALUES ($1, $2, $3::vector)`,
            [
              chunks[i],
              JSON.stringify({
                type: "salesforce_help",
                document_id: id,
                file_name: doc.fileName,
                chunk_index: i,
                total_chunks: chunks.length,
              }),
              vectorLiteral,
            ]
          );
          stored++;
        } catch (err: any) {
          errors.push(`Chunk ${i}: ${err.message}`);
        }
      }

      res.json({
        id,
        fileName: doc.fileName,
        totalChunks: chunks.length,
        chunksStored: stored,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (err: any) {
      console.error("Republish error:", err);
      res.status(500).json({ message: err.message || "Republish failed" });
    }
  });

  // =========================================================================
  // Identity Resolution Rulesets
  // =========================================================================

  /** Ensure table exists */
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS identity_rulesets (
        id SERIAL PRIMARY KEY,
        ruleset_id TEXT NOT NULL UNIQUE,
        data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error("Failed to create identity_rulesets table:", err);
  }

  /** List all rulesets */
  app.get(api.identityRulesets.list.path, async (_req, res) => {
    try {
      const result = await pool.query("SELECT * FROM identity_rulesets ORDER BY id");
      const rulesets = result.rows.map((row: any) => ({
        id: row.id,
        rulesetId: row.ruleset_id,
        ...JSON.parse(row.data),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
      res.json(rulesets);
    } catch (err) {
      console.error("List identity rulesets error:", err);
      res.json([]);
    }
  });

  /** Get single ruleset */
  app.get(api.identityRulesets.get.path, async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM identity_rulesets WHERE id = $1", [Number(req.params.id)]);
      if (result.rows.length === 0) return res.status(404).json({ message: "Not found" });
      const row = result.rows[0];
      res.json({
        id: row.id,
        rulesetId: row.ruleset_id,
        ...JSON.parse(row.data),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    } catch (err: any) {
      console.error("Get identity ruleset error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  /** Create ruleset */
  app.post(api.identityRulesets.create.path, async (req, res) => {
    try {
      const { rulesetId, ...rest } = req.body;
      const data = JSON.stringify(rest);
      const result = await pool.query(
        "INSERT INTO identity_rulesets (ruleset_id, data) VALUES ($1, $2) RETURNING *",
        [rulesetId, data]
      );
      const row = result.rows[0];
      res.status(201).json({
        id: row.id,
        rulesetId: row.ruleset_id,
        ...JSON.parse(row.data),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    } catch (err: any) {
      console.error("Create identity ruleset error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  /** Update ruleset */
  app.put(api.identityRulesets.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { rulesetId, ...rest } = req.body;
      const data = JSON.stringify(rest);
      const result = await pool.query(
        "UPDATE identity_rulesets SET data = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
        [data, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ message: "Not found" });
      const row = result.rows[0];
      res.json({
        id: row.id,
        rulesetId: row.ruleset_id,
        ...JSON.parse(row.data),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    } catch (err: any) {
      console.error("Update identity ruleset error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  /** Delete ruleset */
  app.delete(api.identityRulesets.delete.path, async (req, res) => {
    try {
      await pool.query("DELETE FROM identity_rulesets WHERE id = $1", [Number(req.params.id)]);
      res.json({ deleted: true });
    } catch (err: any) {
      console.error("Delete identity ruleset error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  return httpServer;
}
