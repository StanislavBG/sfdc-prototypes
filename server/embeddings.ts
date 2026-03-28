import { pool } from "./db";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIM = 3072;
const ANSWER_MODEL = "gemini-2.0-flash";

/**
 * Generate a vector embedding for the given text using Google Gemini.
 * Falls back to a zero-vector if no API key is configured (allows the
 * app to run without embeddings — search will just be unavailable).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!GEMINI_API_KEY) {
    console.warn("No GEMINI_API_KEY / GOOGLE_API_KEY set — returning zero vector");
    return new Array(EMBEDDING_DIM).fill(0);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: { parts: [{ text: text.slice(0, 8000) }] },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini embedding error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { embedding: { values: number[] } };
  return data.embedding.values;
}

/**
 * Batch-embed multiple texts in a single API call.
 * Gemini supports up to 100 texts per batch request.
 * Falls back to individual calls if batch API fails.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!GEMINI_API_KEY) {
    return texts.map(() => new Array(EMBEDDING_DIM).fill(0));
  }

  if (texts.length === 0) return [];
  if (texts.length === 1) return [await generateEmbedding(texts[0])];

  const BATCH_SIZE = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${GEMINI_API_KEY}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: batch.map((text) => ({
          model: `models/${EMBEDDING_MODEL}`,
          content: { parts: [{ text: text.slice(0, 8000) }] },
        })),
      }),
    });

    if (!res.ok) {
      // Fallback to individual calls
      console.warn(`Batch embedding failed (${res.status}), falling back to individual calls`);
      for (const text of batch) {
        allEmbeddings.push(await generateEmbedding(text));
      }
      continue;
    }

    const data = (await res.json()) as { embeddings: { values: number[] }[] };
    for (const emb of data.embeddings) {
      allEmbeddings.push(emb.values);
    }
  }

  return allEmbeddings;
}

/**
 * Compute cosine similarity between two vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Generate an AI answer using Gemini, grounded in retrieved context chunks.
 * This is the "Generation" step of RAG: the context from vector search
 * is injected into the system prompt so the LLM answers from your documents.
 */
export async function generateAnswer(
  query: string,
  contextChunks: { content: string; metadata: Record<string, unknown>; similarity: number }[],
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return "AI answers are unavailable — no GEMINI_API_KEY configured.";
  }

  // Build context with source attribution per chunk
  const context = contextChunks
    .map((c, i) => {
      const file = c.metadata.file_name || "unknown";
      const page = c.metadata.page ? ` (page ${c.metadata.page})` : "";
      const heading = c.metadata.heading ? ` — ${c.metadata.heading}` : "";
      return `[Source ${i + 1}: ${file}${page}${heading}]\n${c.content}`;
    })
    .join("\n\n---\n\n");

  const systemPrompt = `You are a helpful assistant that answers questions based on the provided document context. Follow these rules:
- Answer ONLY based on the provided context. Do not use outside knowledge.
- Cite your sources using [Source N] references when stating facts.
- If the context does not contain enough information to answer, say "I don't have enough information in the indexed documents to answer this fully" and explain what you did find.
- Be concise but thorough. Use bullet points for lists.
- If the question is about a table or data, format your answer clearly.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${ANSWER_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [
        {
          parts: [
            { text: `Context from indexed documents:\n\n${context}\n\n---\n\nQuestion: ${query}` },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.2,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini answer error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    candidates: { content: { parts: { text: string }[] } }[];
  };

  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No answer generated.";
}

/**
 * Ensure the documents table, help_documents table, and pgvector extension exist.
 */
export async function ensureVectorTable(): Promise<void> {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS vector`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}',
      embedding vector(${EMBEDDING_DIM}),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS help_documents (
      id SERIAL PRIMARY KEY,
      file_name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}
