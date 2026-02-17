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

// ---------------------------------------------------------------------------
// Chunking utility
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
    start = end - overlap;
    if (start >= text.length) break;
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

  /** Insert a help document and store its chunks with embeddings. */
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

  async reprocessHelpDocument(id: number): Promise<{ chunksStored: number; totalChunks: number; errors: string[] }> {
    const doc = await this.getHelpDocument(id);
    if (!doc) throw new Error("Document not found");

    await pool.query(
      `DELETE FROM documents WHERE metadata->>'document_id' = $1 AND metadata->>'type' = 'salesforce_help'`,
      [String(id)],
    );

    const chunks = chunkText(doc.content);
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
              file_name: doc.fileName,
              chunk_index: i,
              total_chunks: chunks.length,
            }),
            vectorLiteral,
          ],
        );
        stored++;
      } catch (err: any) {
        const msg = `Chunk ${i}: ${err.message}`;
        console.error(`Reprocess chunk ${i} failed for ${doc.fileName}:`, err.message);
        errors.push(msg);
      }
    }

    return { chunksStored: stored, totalChunks: chunks.length, errors };
  }

  /** List all help documents (without full content). */
  async listHelpDocuments(): Promise<
    { id: number; fileName: string; createdAt: Date | null; chunkCount: number }[]
  > {
    const docs = await db.select().from(helpDocuments);
    // Get chunk counts in one query
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
    await pool.query(
      `DELETE FROM documents WHERE metadata->>'document_id' = $1 AND metadata->>'type' = 'salesforce_help'`,
      [String(id)],
    );
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
