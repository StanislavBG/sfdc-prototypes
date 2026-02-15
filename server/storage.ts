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
    const result = await pool.query(
      `INSERT INTO documents (content, metadata, embedding) VALUES ($1, $2, $3) RETURNING id, content, metadata, created_at`,
      [doc.content, JSON.stringify(doc.metadata || {}), JSON.stringify(embedding)]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      content: row.content,
      metadata: row.metadata,
      embedding,
      created_at: row.created_at,
    };
  }

  async queryDocuments(query: string, limit: number = 5): Promise<QueryResult[]> {
    const embedding = await generateEmbedding(query);
    const result = await pool.query(
      `SELECT id, content, metadata, 1 - (embedding <=> $1::vector) as similarity
       FROM documents
       WHERE embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      [JSON.stringify(embedding), limit]
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
      created_at: row.created_at,
    }));
  }

  async deleteDocument(id: number): Promise<void> {
    await pool.query(`DELETE FROM documents WHERE id = $1`, [id]);
  }
}

export const storage = new DatabaseStorage();
