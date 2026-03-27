/**
 * Semantic Chunker
 *
 * An alternative to the rule-based smart chunker that uses embeddings
 * to detect topic boundaries. Embeds each sentence, computes cosine
 * similarity between adjacent sentences, and splits at similarity
 * "valleys" — points where the topic shifts.
 *
 * This is opt-in because it's more expensive (one embedding per sentence
 * via batch API) and slower, but can produce better chunks for long,
 * unstructured prose where topic shifts don't align with paragraph breaks.
 */

import type { ParsedDocument, DocumentSection } from "./document-parser";
import type { DocumentChunk, ChunkMetadata } from "./smart-chunker";
import { generateEmbeddings, cosineSimilarity } from "./embeddings";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const MAX_CHUNK_CHARS = 1500;
const MIN_CHUNK_CHARS = 100;

// ---------------------------------------------------------------------------
// Sentence splitting
// ---------------------------------------------------------------------------

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z\n])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// ---------------------------------------------------------------------------
// Semantic chunking
// ---------------------------------------------------------------------------

export async function semanticChunk(
  doc: ParsedDocument,
  documentId: number,
  fileName: string,
): Promise<DocumentChunk[]> {
  const allChunks: DocumentChunk[] = [];

  for (const section of doc.sections) {
    const sectionChunks = await chunkSectionSemantically(section);

    for (const text of sectionChunks) {
      allChunks.push({
        content: text,
        metadata: {
          type: "salesforce_help",
          document_id: documentId,
          file_name: fileName,
          format: doc.metadata.format,
          chunk_index: 0,
          total_chunks: 0,
          heading: section.heading,
          page: section.page,
          section_index: section.sectionIndex,
          section_type: section.type,
          word_count: text.split(/\s+/).filter(Boolean).length,
          doc_title: doc.title,
          chunking_strategy: "semantic",
        } as ChunkMetadata & { chunking_strategy: string },
      });
    }
  }

  // Set chunk_index and total_chunks
  for (let i = 0; i < allChunks.length; i++) {
    allChunks[i].metadata.chunk_index = i;
    allChunks[i].metadata.total_chunks = allChunks.length;
  }

  return allChunks;
}

async function chunkSectionSemantically(section: DocumentSection): Promise<string[]> {
  const text = section.content;

  // Small sections: return as-is
  if (text.length <= MAX_CHUNK_CHARS) {
    return text.trim() ? [text.trim()] : [];
  }

  // For tables, use simple line-based splitting (semantic doesn't help)
  if (section.type === "table") {
    return simpleChunk(text);
  }

  const sentences = splitSentences(text);

  // Too few sentences for semantic splitting
  if (sentences.length < 4) {
    return simpleChunk(text);
  }

  // Batch-embed all sentences
  let embeddings: number[][];
  try {
    embeddings = await generateEmbeddings(sentences);
  } catch {
    // If embedding fails, fall back to simple chunking
    return simpleChunk(text);
  }

  // Compute similarity between adjacent sentences
  const similarities: number[] = [];
  for (let i = 0; i < embeddings.length - 1; i++) {
    similarities.push(cosineSimilarity(embeddings[i], embeddings[i + 1]));
  }

  // Find split points: valleys below the threshold
  const threshold = computeThreshold(similarities);
  const splitIndices = findSplitPoints(similarities, threshold);

  // Group sentences into chunks based on split points
  const chunks: string[] = [];
  let start = 0;

  for (const splitIdx of splitIndices) {
    const group = sentences.slice(start, splitIdx + 1).join(" ");
    if (group.trim()) {
      chunks.push(group.trim());
    }
    start = splitIdx + 1;
  }

  // Add remaining sentences
  const remaining = sentences.slice(start).join(" ");
  if (remaining.trim()) {
    chunks.push(remaining.trim());
  }

  // Enforce size constraints: merge small chunks, split large ones
  return enforceChunkSizes(chunks);
}

// ---------------------------------------------------------------------------
// Threshold computation (mean - 1 stddev of similarity scores)
// ---------------------------------------------------------------------------

function computeThreshold(similarities: number[]): number {
  if (similarities.length === 0) return 0.5;

  const mean = similarities.reduce((a, b) => a + b, 0) / similarities.length;
  const variance =
    similarities.reduce((sum, s) => sum + (s - mean) ** 2, 0) / similarities.length;
  const stddev = Math.sqrt(variance);

  // Split at points below mean - 1 stddev, but not below 0.3 (absolute floor)
  return Math.max(mean - stddev, 0.3);
}

// ---------------------------------------------------------------------------
// Find split points (similarity valleys)
// ---------------------------------------------------------------------------

function findSplitPoints(similarities: number[], threshold: number): number[] {
  const splits: number[] = [];

  for (let i = 0; i < similarities.length; i++) {
    if (similarities[i] < threshold) {
      // This is a valley: split after sentence i+1
      splits.push(i + 1);
    }
  }

  return splits;
}

// ---------------------------------------------------------------------------
// Enforce min/max chunk sizes
// ---------------------------------------------------------------------------

function enforceChunkSizes(chunks: string[]): string[] {
  const result: string[] = [];

  for (const chunk of chunks) {
    if (chunk.length > MAX_CHUNK_CHARS) {
      // Split oversized chunks at sentence boundaries
      const subSentences = splitSentences(chunk);
      let current = "";
      for (const s of subSentences) {
        const candidate = current ? current + " " + s : s;
        if (candidate.length > MAX_CHUNK_CHARS && current) {
          result.push(current.trim());
          current = s;
        } else {
          current = candidate;
        }
      }
      if (current.trim()) result.push(current.trim());
    } else if (chunk.length < MIN_CHUNK_CHARS && result.length > 0) {
      // Merge tiny chunks with previous
      const prev = result[result.length - 1];
      if (prev.length + chunk.length + 1 <= MAX_CHUNK_CHARS * 1.1) {
        result[result.length - 1] = prev + " " + chunk;
      } else {
        result.push(chunk);
      }
    } else {
      result.push(chunk);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Simple fallback chunker (paragraph-based)
// ---------------------------------------------------------------------------

function simpleChunk(text: string): string[] {
  if (text.length <= MAX_CHUNK_CHARS) return [text.trim()];

  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + MAX_CHUNK_CHARS, text.length);
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(" ", end);
      if (lastSpace > start + MAX_CHUNK_CHARS * 0.7) end = lastSpace;
    }
    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= text.length) break;
    start = end;
  }
  return chunks;
}
