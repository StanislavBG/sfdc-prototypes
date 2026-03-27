import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";
import { storage, chunkText } from "./storage";
import { api } from "@shared/routes";
import { parseMhtml } from "./mhtml-parser";
import { parseDocument } from "./document-parser";
import { generateEmbedding } from "./embeddings";
import { pool } from "./db";
import { z } from "zod";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

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

  // Create drive_files table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS drive_files (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
        size BIGINT NOT NULL DEFAULT 0,
        is_folder BOOLEAN NOT NULL DEFAULT false,
        parent_id INTEGER REFERENCES drive_files(id) ON DELETE CASCADE,
        content TEXT,
        starred BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error("Failed to create drive_files table:", err);
  }

  app.get(api.greeting.get.path, async (_req, res) => {
    const greeting = await storage.getGreeting();
    res.json({ message: greeting?.message || "Hello World" });
  });

  // =========================================================================
  // Google Drive — File Storage
  // =========================================================================

  /** List files in a folder (or root). Query params: ?parentId=N&starred=true */
  app.get(api.driveFiles.list.path, async (req, res) => {
    try {
      const parentId = req.query.parentId ? Number(req.query.parentId) : null;
      const starred = req.query.starred === "true";
      const search = req.query.q ? String(req.query.q).trim() : null;

      let query: string;
      let params: any[];

      if (search) {
        query = `SELECT id, name, mime_type, size, is_folder, parent_id, starred, created_at, updated_at
                 FROM drive_files WHERE LOWER(name) LIKE $1
                 ORDER BY is_folder DESC, LOWER(name) ASC`;
        params = [`%${search.toLowerCase()}%`];
      } else if (starred) {
        query = `SELECT id, name, mime_type, size, is_folder, parent_id, starred, created_at, updated_at
                 FROM drive_files WHERE starred = true
                 ORDER BY is_folder DESC, LOWER(name) ASC`;
        params = [];
      } else if (parentId === null) {
        query = `SELECT id, name, mime_type, size, is_folder, parent_id, starred, created_at, updated_at
                 FROM drive_files WHERE parent_id IS NULL
                 ORDER BY is_folder DESC, LOWER(name) ASC`;
        params = [];
      } else {
        query = `SELECT id, name, mime_type, size, is_folder, parent_id, starred, created_at, updated_at
                 FROM drive_files WHERE parent_id = $1
                 ORDER BY is_folder DESC, LOWER(name) ASC`;
        params = [parentId];
      }

      const result = await pool.query(query, params);
      res.json(result.rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        mimeType: r.mime_type,
        size: Number(r.size),
        isFolder: r.is_folder,
        parentId: r.parent_id,
        starred: r.starred,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })));
    } catch (err) {
      console.error("List drive files error:", err);
      res.json([]);
    }
  });

  /** Get single file (with content for preview) */
  app.get(api.driveFiles.get.path, async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM drive_files WHERE id = $1", [Number(req.params.id)]
      );
      if (result.rows.length === 0) return res.status(404).json({ message: "Not found" });
      const r = result.rows[0];
      res.json({
        id: r.id,
        name: r.name,
        mimeType: r.mime_type,
        size: Number(r.size),
        isFolder: r.is_folder,
        parentId: r.parent_id,
        starred: r.starred,
        content: r.content,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      });
    } catch (err: any) {
      console.error("Get drive file error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  /** Upload file(s) */
  app.post(api.driveFiles.upload.path, upload.array("files", 20), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) return res.status(400).json({ message: "No files uploaded" });

      const parentId = req.body.parentId ? Number(req.body.parentId) : null;
      const results: any[] = [];

      for (const file of files) {
        const name = file.originalname;
        const mimeType = file.mimetype || "application/octet-stream";
        const size = file.size;

        // Store text content directly, binary as base64
        const isText = mimeType.startsWith("text/") ||
          mimeType === "application/json" ||
          mimeType === "application/xml" ||
          mimeType === "application/javascript" ||
          mimeType === "application/typescript" ||
          mimeType.includes("yaml") ||
          mimeType.includes("markdown") ||
          mimeType.includes("csv") ||
          name.endsWith(".md") ||
          name.endsWith(".txt") ||
          name.endsWith(".json") ||
          name.endsWith(".csv") ||
          name.endsWith(".xml") ||
          name.endsWith(".yaml") ||
          name.endsWith(".yml") ||
          name.endsWith(".js") ||
          name.endsWith(".ts") ||
          name.endsWith(".html") ||
          name.endsWith(".css") ||
          name.endsWith(".mhtml") ||
          name.endsWith(".mht");

        const content = isText ? file.buffer.toString("utf-8") : file.buffer.toString("base64");

        const result = await pool.query(
          `INSERT INTO drive_files (name, mime_type, size, is_folder, parent_id, content)
           VALUES ($1, $2, $3, false, $4, $5)
           RETURNING id, name, mime_type, size, is_folder, parent_id, starred, created_at, updated_at`,
          [name, mimeType, size, parentId, content]
        );
        const r = result.rows[0];
        results.push({
          id: r.id,
          name: r.name,
          mimeType: r.mime_type,
          size: Number(r.size),
          isFolder: r.is_folder,
          parentId: r.parent_id,
          starred: r.starred,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        });
      }

      res.status(201).json(results);
    } catch (err: any) {
      console.error("Upload drive file error:", err);
      res.status(500).json({ message: err.message || "Upload failed" });
    }
  });

  /** Create folder */
  app.post(api.driveFiles.createFolder.path, async (req, res) => {
    try {
      const input = api.driveFiles.createFolder.input.parse(req.body);
      const result = await pool.query(
        `INSERT INTO drive_files (name, mime_type, size, is_folder, parent_id)
         VALUES ($1, 'application/x-folder', 0, true, $2)
         RETURNING id, name, mime_type, size, is_folder, parent_id, starred, created_at, updated_at`,
        [input.name, input.parentId ?? null]
      );
      const r = result.rows[0];
      res.status(201).json({
        id: r.id,
        name: r.name,
        mimeType: r.mime_type,
        size: 0,
        isFolder: r.is_folder,
        parentId: r.parent_id,
        starred: r.starred,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error("Create folder error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  /** Update file (rename / move) */
  app.put(api.driveFiles.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.driveFiles.update.input.parse(req.body);
      const sets: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (input.name !== undefined) {
        sets.push(`name = $${idx++}`);
        params.push(input.name);
      }
      if (input.parentId !== undefined) {
        sets.push(`parent_id = $${idx++}`);
        params.push(input.parentId);
      }
      sets.push(`updated_at = NOW()`);
      params.push(id);

      const result = await pool.query(
        `UPDATE drive_files SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
        params
      );
      if (result.rows.length === 0) return res.status(404).json({ message: "Not found" });
      const r = result.rows[0];
      res.json({
        id: r.id,
        name: r.name,
        mimeType: r.mime_type,
        size: Number(r.size),
        isFolder: r.is_folder,
        parentId: r.parent_id,
        starred: r.starred,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error("Update drive file error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  /** Delete file or folder (cascades) */
  app.delete(api.driveFiles.delete.path, async (req, res) => {
    try {
      await pool.query("DELETE FROM drive_files WHERE id = $1", [Number(req.params.id)]);
      res.json({ deleted: true });
    } catch (err: any) {
      console.error("Delete drive file error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  /** Download file content */
  app.get(api.driveFiles.download.path, async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM drive_files WHERE id = $1", [Number(req.params.id)]);
      if (result.rows.length === 0) return res.status(404).json({ message: "Not found" });
      const r = result.rows[0];
      if (r.is_folder) return res.status(400).json({ message: "Cannot download a folder" });

      const isText = r.mime_type.startsWith("text/") ||
        r.mime_type === "application/json" ||
        r.mime_type === "application/xml" ||
        r.mime_type.includes("yaml") ||
        r.mime_type.includes("markdown");

      res.setHeader("Content-Disposition", `attachment; filename="${r.name}"`);
      res.setHeader("Content-Type", r.mime_type);

      if (isText) {
        res.send(r.content);
      } else {
        res.send(Buffer.from(r.content, "base64"));
      }
    } catch (err: any) {
      console.error("Download drive file error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  /** Toggle star */
  app.post(api.driveFiles.star.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const result = await pool.query(
        "UPDATE drive_files SET starred = NOT starred, updated_at = NOW() WHERE id = $1 RETURNING *",
        [id]
      );
      if (result.rows.length === 0) return res.status(404).json({ message: "Not found" });
      const r = result.rows[0];
      res.json({
        id: r.id,
        name: r.name,
        starred: r.starred,
      });
    } catch (err: any) {
      console.error("Star drive file error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  /** Create a text file from pasted content */
  app.post(api.driveFiles.createTextFile.path, async (req, res) => {
    try {
      const input = api.driveFiles.createTextFile.input.parse(req.body);
      const name = input.name;

      // Detect mime type from extension
      const ext = name.split('.').pop()?.toLowerCase() || '';
      const mimeMap: Record<string, string> = {
        txt: 'text/plain', md: 'text/markdown', json: 'application/json',
        csv: 'text/csv', xml: 'application/xml', html: 'text/html',
        css: 'text/css', js: 'application/javascript', ts: 'application/typescript',
        yaml: 'application/x-yaml', yml: 'application/x-yaml',
      };
      const mimeType = mimeMap[ext] || 'text/plain';
      const size = Buffer.byteLength(input.content, 'utf-8');

      const result = await pool.query(
        `INSERT INTO drive_files (name, mime_type, size, is_folder, parent_id, content)
         VALUES ($1, $2, $3, false, $4, $5)
         RETURNING id, name, mime_type, size, is_folder, parent_id, starred, created_at, updated_at`,
        [name, mimeType, size, input.parentId ?? null, input.content]
      );
      const r = result.rows[0];
      res.status(201).json({
        id: r.id,
        name: r.name,
        mimeType: r.mime_type,
        size: Number(r.size),
        isFolder: r.is_folder,
        parentId: r.parent_id,
        starred: r.starred,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error("Create text file error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  // =========================================================================
  // Help Documents
  // =========================================================================

  /** Upload a document — parse, chunk, embed, store. Supports PDF, DOCX, MHTML, CSV, Markdown, plain text. */
  app.post(api.helpDocs.upload.path, upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No file uploaded" });

      const strategy = (req.body?.chunkingStrategy === "semantic" ? "semantic" : "smart") as "smart" | "semantic";
      const { document, parsed, chunksStored, totalChunks, errors, chunkingStrategy } = await storage.insertDocument(file.buffer, file.originalname, strategy);

      const response: Record<string, unknown> = {
        id: document.id,
        fileName: document.fileName,
        format: parsed.metadata.format,
        contentLength: parsed.metadata.charCount,
        sections: parsed.sections.length,
        pageCount: parsed.metadata.pageCount,
        chunksStored,
        totalChunks,
        chunkingStrategy,
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
      let format = "";
      try {
        const parsed = await parseDocument(file.buffer, file.originalname);
        title = parsed.title;
        content = parsed.content;
        format = parsed.metadata.format;
        steps.push({
          step: "Document parsing",
          status: content.length > 0 ? "ok" : "error",
          detail: `Format: ${format} | Title: "${title}" | Content: ${content.length} chars | Sections: ${parsed.sections.length}${parsed.metadata.pageCount ? ` | Pages: ${parsed.metadata.pageCount}` : ""}`,
        });
      } catch (e: any) {
        steps.push({ step: "Document parsing", status: "error", detail: e.message });
        return res.json({ steps });
      }

      // Step 6: Chunking (test with legacy chunker for diagnostics)
      const chunks = chunkText(content);
      steps.push({
        step: "Chunking",
        status: "ok",
        detail: `${chunks.length} chunk(s) from ${format || "text"} format | First chunk: ${chunks[0]?.length || 0} chars`,
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

  /** Re-publish: re-chunk and re-embed an existing document using smart chunker. */
  app.post(api.helpDocs.republish.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const result = await storage.reprocessHelpDocument(id);
      const doc = await storage.getHelpDocument(id);
      res.json({
        id,
        fileName: doc?.fileName,
        totalChunks: result.totalChunks,
        chunksStored: result.chunksStored,
        errors: result.errors.length > 0 ? result.errors : undefined,
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
