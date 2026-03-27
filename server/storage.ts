import { db } from "./db";
import { pool } from "./db";
import { eq } from "drizzle-orm";
import {
  greetings,
  helpDocuments,
  type InsertGreeting,
  type Greeting,
  type HelpDocument,
} from "@shared/schema";
import { generateEmbedding, ensureVectorTable } from "./embeddings";
import { parseDocument, type ParsedDocument } from "./document-parser";
import { smartChunk, type DocumentChunk } from "./smart-chunker";
import { semanticChunk } from "./semantic-chunker";

export type ChunkingStrategy = "smart" | "semantic";

// ---------------------------------------------------------------------------
// Legacy chunking utility (kept for backwards compat / reprocess)
// ---------------------------------------------------------------------------

const CHUNK_MAX_CHARS = 1500;
const CHUNK_OVERLAP = 200;

export function chunkText(
  text: string,
  maxChars = CHUNK_MAX_CHARS,
  overlap = CHUNK_OVERLAP,
): string[] {
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start = end - overlap;
  }
  return chunks;
}

function toVectorLiteral(arr: number[]): string {
  return `[${arr.join(",")}]`;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export class DatabaseStorage {
  // ---- Greeting (kept for server bootstrap) ----

  async getGreeting(): Promise<Greeting | undefined> {
    const allGreetings = await db.select().from(greetings);
    return allGreetings[0];
  }

  async createGreeting(insertGreeting: InsertGreeting): Promise<Greeting> {
    const [greeting] = await db
      .insert(greetings)
      .values(insertGreeting)
      .returning();
    return greeting;
  }

  // ---- Help Documents ----

  async init(): Promise<void> {
    await ensureVectorTable();
  }

  /**
   * Insert a document using the new multi-format parser + smart chunker.
   * Accepts any supported format (PDF, MHTML, CSV, Markdown, plain text).
   */
  async insertDocument(
    buffer: Buffer,
    fileName: string,
    chunkingStrategy: ChunkingStrategy = "smart",
  ): Promise<{
    document: HelpDocument;
    parsed: ParsedDocument;
    chunksStored: number;
    totalChunks: number;
    errors: string[];
    chunkingStrategy: ChunkingStrategy;
  }> {
    // 1. Parse the document
    const parsed = await parseDocument(buffer, fileName);

    // 2. Store master record
    const [doc] = await db
      .insert(helpDocuments)
      .values({ fileName, content: parsed.content })
      .returning();

    // 3. Chunk with selected strategy
    const chunks = chunkingStrategy === "semantic"
      ? await semanticChunk(parsed, doc.id, fileName)
      : smartChunk(parsed, doc.id, fileName);

    // 4. Embed and store each chunk
    const { stored, errors } = await this.embedAndStoreChunks(chunks);

    return {
      document: doc,
      parsed,
      chunksStored: stored,
      totalChunks: chunks.length,
      errors,
      chunkingStrategy,
    };
  }

  /**
   * Legacy insert method (kept for backwards compat).
   * Use insertDocument() for new uploads.
   */
  async insertHelpDocument(
    fileName: string,
    content: string,
  ): Promise<{ document: HelpDocument; chunksStored: number; totalChunks: number; errors: string[] }> {
    const [doc] = await db
      .insert(helpDocuments)
      .values({ fileName, content })
      .returning();

    const chunks = chunkText(content);
    let stored = 0;
    const errors: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      try {
        const embedding = await generateEmbedding(chunks[i]);
        const vectorLiteral = toVectorLiteral(embedding);
        await pool.query(
          `INSERT INTO documents (content, metadata, embedding)
           VALUES ($1, $2, $3::vector)`,
          [
            chunks[i],
            JSON.stringify({
              type: "salesforce_help",
              document_id: doc.id,
              file_name: fileName,
              chunk_index: i,
              total_chunks: chunks.length,
            }),
            vectorLiteral,
          ],
        );
        stored++;
      } catch (err: any) {
        const msg = `Chunk ${i}: ${err.message}`;
        console.error(`Chunk ${i} embedding failed for ${fileName}:`, err.message);
        errors.push(msg);
      }
    }

    return { document: doc, chunksStored: stored, totalChunks: chunks.length, errors };
  }

  /**
   * Re-process a document: delete old chunks, re-parse from stored content,
   * re-chunk with smart chunker, and re-embed.
   */
  async reprocessHelpDocument(id: number): Promise<{ chunksStored: number; totalChunks: number; errors: string[] }> {
    const doc = await this.getHelpDocument(id);
    if (!doc) throw new Error("Document not found");

    // Delete old chunks
    await pool.query(
      `DELETE FROM documents WHERE metadata->>'document_id' = $1 AND metadata->>'type' = 'salesforce_help'`,
      [String(id)],
    );

    // Re-parse using stored content (detect format from filename)
    const buffer = Buffer.from(doc.content, "utf-8");
    const parsed = await parseDocument(buffer, doc.fileName);
    const chunks = smartChunk(parsed, doc.id, doc.fileName);

    const { stored, errors } = await this.embedAndStoreChunks(chunks);

    return { chunksStored: stored, totalChunks: chunks.length, errors };
  }

  /** Embed and store an array of DocumentChunks. */
  private async embedAndStoreChunks(
    chunks: DocumentChunk[],
  ): Promise<{ stored: number; errors: string[] }> {
    let stored = 0;
    const errors: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        const embedding = await generateEmbedding(chunk.content);
        const vectorLiteral = toVectorLiteral(embedding);
        await pool.query(
          `INSERT INTO documents (content, metadata, embedding)
           VALUES ($1, $2, $3::vector)`,
          [chunk.content, JSON.stringify(chunk.metadata), vectorLiteral],
        );
        stored++;
      } catch (err: any) {
        const msg = `Chunk ${i}: ${err.message}`;
        console.error(`Chunk ${i} embedding failed:`, err.message);
        errors.push(msg);
      }
    }

    return { stored, errors };
  }

  /** List all help documents (without full content). */
  async listHelpDocuments(): Promise<
    { id: number; fileName: string; createdAt: Date | null; chunkCount: number }[]
  > {
    const docs = await db.select().from(helpDocuments);
    const chunkCounts = await pool.query(`
      SELECT metadata->>'document_id' as doc_id, COUNT(*) as cnt
      FROM documents
      WHERE metadata->>'type' = 'salesforce_help'
      GROUP BY metadata->>'document_id'
    `);
    const countMap = new Map<number, number>();
    for (const row of chunkCounts.rows) {
      countMap.set(Number(row.doc_id), Number(row.cnt));
    }

    return docs.map((d) => ({
      id: d.id,
      fileName: d.fileName,
      createdAt: d.createdAt,
      chunkCount: countMap.get(d.id) || 0,
    }));
  }

  /** Get a single help document by id (with full content). */
  async getHelpDocument(id: number): Promise<HelpDocument | undefined> {
    const rows = await db
      .select()
      .from(helpDocuments)
      .where(eq(helpDocuments.id, id));
    return rows[0];
  }

  /** Delete a help document and all its chunks. */
  async deleteHelpDocument(id: number): Promise<number> {
    try {
      await pool.query(
        `DELETE FROM documents WHERE metadata->>'document_id' = $1 AND metadata->>'type' = 'salesforce_help'`,
        [String(id)],
      );
    } catch (err: any) {
      console.warn(`Could not delete chunks for doc ${id}:`, err.message);
    }
    await db.delete(helpDocuments).where(eq(helpDocuments.id, id));
    return 1;
  }

  /** Semantic search across help document chunks. */
  async searchHelpDocuments(
    query: string,
    limit = 10,
  ): Promise<
    {
      id: number;
      content: string;
      metadata: Record<string, unknown>;
      similarity: number;
    }[]
  > {
    const embedding = await generateEmbedding(query);
    const vectorLiteral = toVectorLiteral(embedding);
    const result = await pool.query(
      `SELECT id, content, metadata, 1 - (embedding <=> $1::vector) as similarity
       FROM documents
       WHERE embedding IS NOT NULL AND metadata->>'type' = 'salesforce_help'
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      [vectorLiteral, limit],
    );
    return result.rows.map((row: any) => ({
      id: row.id,
      content: row.content,
      metadata: row.metadata,
      similarity: parseFloat(row.similarity),
    }));
  }
}

export const storage = new DatabaseStorage();
