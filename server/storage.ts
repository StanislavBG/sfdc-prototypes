import { db } from "./db";
import { greetings, type InsertGreeting, type Greeting, type Document, type InsertDocument, type QueryResult } from "@shared/schema";
import { pool } from "./db";
import { generateEmbedding } from "./embeddings";

export interface IStorage {
  getGreeting(): Promise<Greeting | undefined>;
  createGreeting(greeting: InsertGreeting): Promise<Greeting>;
  insertDocument(doc: InsertDocument): Promise<Document>;
  queryDocuments(query: string, limit?: number): Promise<QueryResult[]>;
  listDocuments(): Promise<Document[]>;
  deleteDocument(id: number): Promise<void>;
  // Article / crawler operations
  upsertArticleChunks(articleId: string, chunks: { content: string; metadata: Record<string, unknown> }[]): Promise<number>;
  listArticles(): Promise<{ articleId: string; title: string; url: string; parentId: string | null; chunkCount: number }[]>;
  /** Return just the article IDs that already exist in the DB (lightweight). */
  listArticleIds(): Promise<string[]>;
  getArticleTree(): Promise<Record<string, { title: string; url: string; parentId: string | null; children: string[] }>>;
  deleteArticle(articleId: string): Promise<number>;
  queryArticles(query: string, limit?: number): Promise<QueryResult[]>;
}

function toVectorLiteral(arr: number[]): string {
  return `[${arr.join(",")}]`;
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

  async insertDocument(doc: InsertDocument): Promise<Document> {
    const embedding = await generateEmbedding(doc.content);
    const vectorLiteral = toVectorLiteral(embedding);
    const result = await pool.query(
      `INSERT INTO documents (content, metadata, embedding) VALUES ($1, $2, $3::vector) RETURNING id, content, metadata, created_at`,
      [doc.content, JSON.stringify(doc.metadata || {}), vectorLiteral]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      content: row.content,
      metadata: row.metadata,
      embedding: null,
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    };
  }

  async queryDocuments(query: string, limit: number = 5): Promise<QueryResult[]> {
    const embedding = await generateEmbedding(query);
    const vectorLiteral = toVectorLiteral(embedding);
    const result = await pool.query(
      `SELECT id, content, metadata, 1 - (embedding <=> $1::vector) as similarity
       FROM documents
       WHERE embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      [vectorLiteral, limit]
    );
    return result.rows.map((row: any) => ({
      id: row.id,
      content: row.content,
      metadata: row.metadata,
      similarity: parseFloat(row.similarity),
    }));
  }

  async listDocuments(): Promise<Document[]> {
    const result = await pool.query(
      `SELECT id, content, metadata, created_at FROM documents ORDER BY created_at DESC`
    );
    return result.rows.map((row: any) => ({
      id: row.id,
      content: row.content,
      metadata: row.metadata,
      embedding: null,
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    }));
  }

  async deleteDocument(id: number): Promise<void> {
    await pool.query(`DELETE FROM documents WHERE id = $1`, [id]);
  }

  // ---- Article / Crawler operations ----

  /**
   * Upsert all chunks for an article. Deletes existing chunks for the same
   * article_id first, then inserts the new chunks with embeddings.
   * Returns the number of chunks stored.
   */
  async upsertArticleChunks(
    articleId: string,
    chunks: { content: string; metadata: Record<string, unknown> }[]
  ): Promise<number> {
    // Delete old chunks for this article
    await pool.query(
      `DELETE FROM documents WHERE metadata->>'article_id' = $1`,
      [articleId]
    );

    let stored = 0;
    for (const chunk of chunks) {
      try {
        const embedding = await generateEmbedding(chunk.content);
        const vectorLiteral = toVectorLiteral(embedding);
        await pool.query(
          `INSERT INTO documents (content, metadata, embedding) VALUES ($1, $2, $3::vector)`,
          [chunk.content, JSON.stringify(chunk.metadata), vectorLiteral]
        );
        stored++;
      } catch (err: any) {
        console.error(`Failed to embed chunk for ${articleId}:`, err.message);
      }
    }
    return stored;
  }

  /**
   * Return just the distinct article IDs stored in the DB.
   */
  async listArticleIds(): Promise<string[]> {
    const result = await pool.query(`
      SELECT DISTINCT metadata->>'article_id' as article_id
      FROM documents
      WHERE metadata->>'type' = 'salesforce_doc'
        AND metadata->>'article_id' IS NOT NULL
    `);
    return result.rows.map((r: any) => r.article_id);
  }

  /**
   * List distinct articles stored in the documents table (grouped by article_id).
   */
  async listArticles(): Promise<{ articleId: string; title: string; url: string; parentId: string | null; chunkCount: number }[]> {
    const result = await pool.query(`
      SELECT
        metadata->>'article_id' as article_id,
        metadata->>'title' as title,
        metadata->>'url' as url,
        metadata->>'parent_id' as parent_id,
        COUNT(*) as chunk_count
      FROM documents
      WHERE metadata->>'type' = 'salesforce_doc'
      GROUP BY metadata->>'article_id', metadata->>'title', metadata->>'url', metadata->>'parent_id'
      ORDER BY metadata->>'article_id'
    `);
    return result.rows.map((r: any) => ({
      articleId: r.article_id,
      title: r.title,
      url: r.url,
      parentId: r.parent_id || null,
      chunkCount: parseInt(r.chunk_count, 10),
    }));
  }

  /**
   * Build a tree structure from stored articles.
   */
  async getArticleTree(): Promise<Record<string, { title: string; url: string; parentId: string | null; children: string[] }>> {
    const articles = await this.listArticles();
    const tree: Record<string, { title: string; url: string; parentId: string | null; children: string[] }> = {};

    // First pass: create nodes
    for (const a of articles) {
      tree[a.articleId] = {
        title: a.title,
        url: a.url,
        parentId: a.parentId,
        children: [],
      };
    }

    // Second pass: wire parent → child
    for (const a of articles) {
      if (a.parentId && tree[a.parentId]) {
        tree[a.parentId].children.push(a.articleId);
      }
    }

    return tree;
  }

  /**
   * Delete all chunks belonging to an article. Returns count deleted.
   */
  async deleteArticle(articleId: string): Promise<number> {
    const result = await pool.query(
      `DELETE FROM documents WHERE metadata->>'article_id' = $1`,
      [articleId]
    );
    return result.rowCount ?? 0;
  }

  /**
   * Semantic search restricted to Salesforce doc articles.
   */
  async queryArticles(query: string, limit: number = 5): Promise<QueryResult[]> {
    const embedding = await generateEmbedding(query);
    const vectorLiteral = toVectorLiteral(embedding);
    const result = await pool.query(
      `SELECT id, content, metadata, 1 - (embedding <=> $1::vector) as similarity
       FROM documents
       WHERE embedding IS NOT NULL AND metadata->>'type' = 'salesforce_doc'
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      [vectorLiteral, limit]
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
