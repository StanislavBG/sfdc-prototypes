/**
 * Smart Chunker
 *
 * Takes a ParsedDocument and produces embedding-ready chunks with rich metadata.
 * Unlike the old fixed-window chunker, this:
 *
 *   1. Respects document structure (sections, headings, pages)
 *   2. Splits on semantic boundaries (paragraphs > sentences > characters)
 *   3. Preserves heading context in every chunk
 *   4. Adds overlap only at character-level splits (not between sections)
 *   5. Attaches rich metadata for search result attribution
 */

import type { ParsedDocument, DocumentSection } from "./document-parser";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const MAX_CHUNK_CHARS = 1500;
const MIN_CHUNK_CHARS = 100;    // Don't create tiny chunks
const OVERLAP_CHARS = 150;       // Overlap when splitting within a section

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DocumentChunk {
  content: string;
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  type: string;               // 'salesforce_help' (for backwards compat)
  document_id: number;
  file_name: string;
  format: string;             // 'pdf', 'mhtml', 'csv', etc.
  chunk_index: number;
  total_chunks: number;
  // Structural metadata
  heading?: string;           // heading this chunk belongs to
  page?: number;              // page number (PDF)
  section_index?: number;     // original section index
  section_type?: string;      // 'text', 'table', 'list', 'code'
  // Document-level metadata
  word_count: number;         // words in this chunk
  doc_title?: string;         // document title for context
}

// ---------------------------------------------------------------------------
// Smart chunking
// ---------------------------------------------------------------------------

export function smartChunk(
  doc: ParsedDocument,
  documentId: number,
  fileName: string,
): DocumentChunk[] {
  const allChunks: DocumentChunk[] = [];

  for (const section of doc.sections) {
    const sectionChunks = chunkSection(section);

    for (const text of sectionChunks) {
      allChunks.push({
        content: text,
        metadata: {
          type: "salesforce_help",
          document_id: documentId,
          file_name: fileName,
          format: doc.metadata.format,
          chunk_index: 0, // will be set below
          total_chunks: 0, // will be set below
          heading: section.heading,
          page: section.page,
          section_index: section.sectionIndex,
          section_type: section.type,
          word_count: text.split(/\s+/).filter(Boolean).length,
          doc_title: doc.title,
        },
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

// ---------------------------------------------------------------------------
// Section-level chunking — respects semantic boundaries
// ---------------------------------------------------------------------------

function chunkSection(section: DocumentSection): string[] {
  const text = section.content;

  // If section fits in one chunk, return as-is
  if (text.length <= MAX_CHUNK_CHARS) {
    return text.trim() ? [text.trim()] : [];
  }

  // For tables, split by rows
  if (section.type === "table") {
    return chunkByLines(text);
  }

  // Try splitting by paragraphs first
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim());
  if (paragraphs.length > 1) {
    return chunkByParagraphs(paragraphs, section.heading);
  }

  // Try splitting by sentences
  const sentences = splitSentences(text);
  if (sentences.length > 1) {
    return chunkBySentences(sentences);
  }

  // Last resort: fixed-window with overlap
  return chunkByCharacters(text);
}

// ---------------------------------------------------------------------------
// Paragraph-based chunking
// ---------------------------------------------------------------------------

function chunkByParagraphs(paragraphs: string[], heading?: string): string[] {
  const chunks: string[] = [];
  let currentChunk = "";

  // Prepend heading context if available
  const headingPrefix = heading ? `${heading}\n\n` : "";

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const candidate = currentChunk
      ? currentChunk + "\n\n" + trimmed
      : headingPrefix + trimmed;

    if (candidate.length <= MAX_CHUNK_CHARS) {
      currentChunk = candidate;
    } else {
      // Flush current chunk
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }

      // If single paragraph exceeds max, split it further
      if (trimmed.length > MAX_CHUNK_CHARS) {
        const subChunks = chunkBySentences(splitSentences(trimmed));
        chunks.push(...subChunks);
        currentChunk = "";
      } else {
        currentChunk = headingPrefix + trimmed;
      }
    }
  }

  if (currentChunk.trim()) {
    // Merge tiny trailing chunk with previous if possible
    if (currentChunk.trim().length < MIN_CHUNK_CHARS && chunks.length > 0) {
      const last = chunks[chunks.length - 1];
      if (last.length + currentChunk.length + 2 <= MAX_CHUNK_CHARS * 1.1) {
        chunks[chunks.length - 1] = last + "\n\n" + currentChunk.trim();
      } else {
        chunks.push(currentChunk.trim());
      }
    } else {
      chunks.push(currentChunk.trim());
    }
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Sentence-based chunking
// ---------------------------------------------------------------------------

function splitSentences(text: string): string[] {
  // Split on sentence boundaries: ". ", "! ", "? " followed by uppercase or newline
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z\n])/)
    .filter((s) => s.trim());
}

function chunkBySentences(sentences: string[]): string[] {
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    const candidate = current ? current + " " + trimmed : trimmed;

    if (candidate.length <= MAX_CHUNK_CHARS) {
      current = candidate;
    } else {
      if (current.trim()) chunks.push(current.trim());
      // If single sentence is too long, split by characters
      if (trimmed.length > MAX_CHUNK_CHARS) {
        chunks.push(...chunkByCharacters(trimmed));
        current = "";
      } else {
        current = trimmed;
      }
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Line-based chunking (for tables/CSV)
// ---------------------------------------------------------------------------

function chunkByLines(text: string): string[] {
  const lines = text.split("\n");
  const chunks: string[] = [];
  let current = "";

  // Preserve the header line (first line) in every chunk for tables
  const header = lines[0];
  const isTable = header && lines.length > 2;

  for (let i = isTable ? 1 : 0; i < lines.length; i++) {
    const line = lines[i];
    const prefix = isTable && !current ? header + "\n" : "";
    const candidate = current ? current + "\n" + line : prefix + line;

    if (candidate.length <= MAX_CHUNK_CHARS) {
      current = candidate;
    } else {
      if (current.trim()) chunks.push(current.trim());
      current = isTable ? header + "\n" + line : line;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Character-based chunking (last resort, with overlap)
// ---------------------------------------------------------------------------

function chunkByCharacters(text: string): string[] {
  if (text.length <= MAX_CHUNK_CHARS) return [text.trim()];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + MAX_CHUNK_CHARS, text.length);

    // Try to break at a word boundary
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(" ", end);
      if (lastSpace > start + MAX_CHUNK_CHARS * 0.7) {
        end = lastSpace;
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);

    if (end >= text.length) break;
    start = end - OVERLAP_CHARS;
  }

  return chunks;
}
