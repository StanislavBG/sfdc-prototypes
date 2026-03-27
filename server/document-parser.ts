/**
 * Document Parser Framework
 *
 * Pluggable parser architecture that detects file type and routes to the
 * appropriate parser. Each parser returns a uniform ParsedDocument with
 * structured sections and metadata, which feeds into the smart chunker.
 *
 * Supported formats:
 *   - PDF  (.pdf)          — pdf-parse for text extraction with page tracking
 *   - MHTML (.mhtml, .mht) — existing cheerio-based parser
 *   - CSV  (.csv)          — row-based parsing with header awareness
 *   - Markdown (.md)       — heading-aware section splitting
 *   - Plain text (.txt)    — paragraph-based splitting
 */

import * as cheerio from "cheerio";
import { ocrPdfWithVision, describeDocumentImages } from "./vision-describer";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface DocumentSection {
  content: string;
  heading?: string;        // section heading if detected
  page?: number;           // page number (PDF)
  sectionIndex: number;    // sequential index
  type: "text" | "table" | "list" | "code" | "heading";
}

export interface ParsedDocument {
  title: string;
  content: string;         // full plain text (for backwards compat)
  sections: DocumentSection[];
  metadata: {
    format: string;        // 'pdf' | 'mhtml' | 'csv' | 'markdown' | 'text'
    pageCount?: number;
    wordCount: number;
    charCount: number;
    [key: string]: unknown;
  };
}

// ---------------------------------------------------------------------------
// Format detection
// ---------------------------------------------------------------------------

const FORMAT_MAP: Record<string, string> = {
  ".pdf": "pdf",
  ".docx": "docx",
  ".mhtml": "mhtml",
  ".mht": "mhtml",
  ".csv": "csv",
  ".tsv": "csv",
  ".md": "markdown",
  ".markdown": "markdown",
  ".txt": "text",
  ".text": "text",
  ".log": "text",
  ".json": "text",
  ".xml": "text",
  ".html": "mhtml",
  ".htm": "mhtml",
};

export function detectFormat(fileName: string): string {
  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  return FORMAT_MAP[ext] || "text";
}

// ---------------------------------------------------------------------------
// PDF Parser
// ---------------------------------------------------------------------------

async function parsePdf(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
  // Dynamic import to avoid issues if pdf-parse isn't installed
  const pdfParse = (await import("pdf-parse")).default;

  const data = await pdfParse(buffer, {
    // Custom page renderer to get per-page text
    pagerender: undefined,
  });

  let fullText = data.text || "";
  const title = (data.info?.Title as string) || fileName.replace(/\.pdf$/i, "");
  const pageCount = data.numpages || 1;
  let isOcr = false;

  // Detect scanned/image-based PDFs (very little text per page)
  const textDensity = fullText.trim().length / (pageCount || 1);
  if (textDensity < 50) {
    try {
      console.log(`Low text density (${textDensity.toFixed(0)} chars/page) — trying OCR via Gemini Vision`);
      const ocrResult = await ocrPdfWithVision(buffer, fileName);
      if (ocrResult.text.trim().length > fullText.trim().length) {
        fullText = ocrResult.text;
        isOcr = true;
      }
    } catch (err: any) {
      console.warn("OCR fallback failed:", err.message);
      // Continue with whatever text we have
    }
  }

  const sections: DocumentSection[] = [];

  // Try to get per-page text by re-parsing with page tracking
  // pdf-parse gives us the full text, but we can estimate page boundaries
  const avgCharsPerPage = Math.ceil(fullText.length / pageCount);
  let sectionIdx = 0;

  for (let page = 0; page < pageCount; page++) {
    const start = page * avgCharsPerPage;
    const end = Math.min((page + 1) * avgCharsPerPage, fullText.length);
    const pageText = fullText.slice(start, end).trim();

    if (!pageText) continue;

    // Split page into text and table regions
    const regions = splitTextAndTables(pageText);
    for (const region of regions) {
      if (region.type === "table") {
        sections.push({
          content: region.content,
          heading: region.heading,
          page: page + 1,
          sectionIndex: sectionIdx++,
          type: "table",
        });
      } else {
        // Within text regions, split on heading-like patterns
        const subSections = splitOnHeadings(region.content);
        for (const sub of subSections) {
          sections.push({
            content: sub.content,
            heading: sub.heading || region.heading,
            page: page + 1,
            sectionIndex: sectionIdx++,
            type: sub.type,
          });
        }
      }
    }
  }

  // Fallback: if no sections were created, use the full text
  if (sections.length === 0 && fullText.trim()) {
    sections.push({
      content: fullText.trim(),
      sectionIndex: 0,
      type: "text",
    });
  }

  // Try to extract image descriptions (opt-in, non-blocking)
  try {
    const images = await describeDocumentImages(buffer, fileName);
    for (const img of images) {
      sections.push({
        content: `[Image on page ${img.page}] ${img.description}`,
        heading: `Image — Page ${img.page}`,
        page: img.page,
        sectionIndex: sectionIdx++,
        type: "text",
      });
    }
  } catch {
    // Image description is best-effort
  }

  return {
    title,
    content: fullText,
    sections,
    metadata: {
      format: "pdf",
      pageCount,
      wordCount: fullText.split(/\s+/).filter(Boolean).length,
      charCount: fullText.length,
      author: data.info?.Author || undefined,
      subject: data.info?.Subject || undefined,
      ocrApplied: isOcr,
    },
  };
}

// ---------------------------------------------------------------------------
// MHTML Parser (refactored from mhtml-parser.ts)
// ---------------------------------------------------------------------------

function parseMhtmlDoc(buffer: Buffer, fileName: string): ParsedDocument {
  const raw = buffer.toString("utf-8");

  const boundaryMatch = raw.match(/boundary="?([^\s";]+)"?/i);
  let html = raw;

  if (boundaryMatch) {
    const boundary = boundaryMatch[1];
    const parts = raw.split(`--${boundary}`);

    for (const part of parts) {
      const headerEnd = part.indexOf("\r\n\r\n");
      if (headerEnd === -1) continue;

      const headers = part.slice(0, headerEnd);
      if (!/content-type:\s*text\/html/i.test(headers)) continue;

      let body = part.slice(headerEnd + 4);
      const endBoundary = body.indexOf(`--${boundary}`);
      if (endBoundary !== -1) body = body.slice(0, endBoundary);

      if (/content-transfer-encoding:\s*quoted-printable/i.test(headers)) {
        body = body
          .replace(/=\r?\n/g, "")
          .replace(/=([0-9A-Fa-f]{2})/g, (_m, hex) =>
            String.fromCharCode(parseInt(hex, 16))
          );
      } else if (/content-transfer-encoding:\s*base64/i.test(headers)) {
        body = Buffer.from(body.replace(/\s/g, ""), "base64").toString("utf-8");
      }

      html = body;
      break;
    }
  }

  return parseHtml(html, fileName);
}

function parseHtml(html: string, fileName: string): ParsedDocument {
  const $ = cheerio.load(html);

  // Remove noise
  $(
    "script, style, nav, header, footer, aside, iframe, noscript, img, svg, " +
    ".sidebar, .nav, .menu, .ad, [role='navigation'], [role='banner'], [role='complementary']"
  ).remove();

  const title =
    $("h1").first().text().trim() ||
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("title").text().trim() ||
    fileName.replace(/\.(mhtml|mht|html|htm)$/i, "");

  // Try content selectors
  const selectors = [
    ".article-content", ".articleBody", "article",
    '[role="main"]', "main", "#content", ".content-wrapper",
  ];
  let $content: ReturnType<typeof $> = $("body");
  for (const sel of selectors) {
    const el = $(sel).first();
    if (el.length && el.text().trim().length > 200) {
      $content = el;
      break;
    }
  }

  // Extract sections by heading tags
  const sections: DocumentSection[] = [];
  let currentHeading: string | undefined;
  let currentText = "";
  let sectionIdx = 0;

  $content.children().each((_i, el) => {
    const tagName = (el as any).tagName?.toLowerCase() || "";
    const text = $(el).text().trim();

    if (/^h[1-6]$/.test(tagName) && text) {
      // Flush previous section
      if (currentText.trim()) {
        sections.push({
          content: currentText.trim(),
          heading: currentHeading,
          sectionIndex: sectionIdx++,
          type: "text",
        });
      }
      currentHeading = text;
      currentText = "";
    } else if (text) {
      currentText += text + "\n\n";
    }
  });

  // Flush last section
  if (currentText.trim()) {
    sections.push({
      content: currentText.trim(),
      heading: currentHeading,
      sectionIndex: sectionIdx++,
      type: "text",
    });
  }

  const fullContent = $content
    .text()
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Fallback if heading extraction yielded nothing
  if (sections.length === 0 && fullContent) {
    const subs = splitOnHeadings(fullContent);
    for (const sub of subs) {
      sections.push({
        content: sub.content,
        heading: sub.heading,
        sectionIndex: sectionIdx++,
        type: sub.type,
      });
    }
  }

  return {
    title,
    content: fullContent,
    sections,
    metadata: {
      format: "mhtml",
      wordCount: fullContent.split(/\s+/).filter(Boolean).length,
      charCount: fullContent.length,
    },
  };
}

// ---------------------------------------------------------------------------
// DOCX Parser (via Mammoth → HTML → existing parseHtml)
// ---------------------------------------------------------------------------

async function parseDocx(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
  const mammoth = await import("mammoth");
  const result = await mammoth.convertToHtml({ buffer });
  const doc = parseHtml(result.value, fileName);
  doc.metadata.format = "docx";
  if (result.messages.length > 0) {
    doc.metadata.mammothWarnings = result.messages
      .filter((m: any) => m.type === "warning")
      .map((m: any) => m.message);
  }
  return doc;
}

// ---------------------------------------------------------------------------
// CSV Parser
// ---------------------------------------------------------------------------

function parseCsv(buffer: Buffer, fileName: string): ParsedDocument {
  const text = buffer.toString("utf-8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim());

  if (lines.length === 0) {
    return {
      title: fileName,
      content: "",
      sections: [],
      metadata: { format: "csv", wordCount: 0, charCount: 0, rowCount: 0 },
    };
  }

  // Detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes("\t") ? "\t" : ",";
  const headers = firstLine.split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ""));

  const sections: DocumentSection[] = [];
  const ROWS_PER_SECTION = 50; // Group rows into sections for chunking

  for (let i = 1; i < lines.length; i += ROWS_PER_SECTION) {
    const batch = lines.slice(i, i + ROWS_PER_SECTION);
    const rowTexts = batch.map((line) => {
      const values = line.split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ""));
      return headers.map((h, idx) => `${h}: ${values[idx] || ""}`).join(" | ");
    });

    sections.push({
      content: `Columns: ${headers.join(", ")}\n\n${rowTexts.join("\n")}`,
      heading: `Rows ${i} – ${Math.min(i + ROWS_PER_SECTION - 1, lines.length - 1)}`,
      sectionIndex: sections.length,
      type: "table",
    });
  }

  return {
    title: fileName.replace(/\.(csv|tsv)$/i, ""),
    content: text,
    sections,
    metadata: {
      format: "csv",
      wordCount: text.split(/\s+/).filter(Boolean).length,
      charCount: text.length,
      rowCount: lines.length - 1,
      columnCount: headers.length,
      columns: headers,
    },
  };
}

// ---------------------------------------------------------------------------
// Markdown Parser
// ---------------------------------------------------------------------------

function parseMarkdown(buffer: Buffer, fileName: string): ParsedDocument {
  const text = buffer.toString("utf-8");

  // Extract title from first heading or filename
  const titleMatch = text.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1]?.trim() || fileName.replace(/\.(md|markdown)$/i, "");

  // Split on markdown headings (## or ###)
  const sections: DocumentSection[] = [];
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let lastIndex = 0;
  let lastHeading: string | undefined;
  let sectionIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(text)) !== null) {
    // Content before this heading
    const content = text.slice(lastIndex, match.index).trim();
    if (content) {
      sections.push({
        content,
        heading: lastHeading,
        sectionIndex: sectionIdx++,
        type: "text",
      });
    }
    lastHeading = match[2].trim();
    lastIndex = match.index + match[0].length;
  }

  // Remaining content after last heading
  const remaining = text.slice(lastIndex).trim();
  if (remaining) {
    sections.push({
      content: remaining,
      heading: lastHeading,
      sectionIndex: sectionIdx++,
      type: "text",
    });
  }

  // Fallback
  if (sections.length === 0 && text.trim()) {
    sections.push({
      content: text.trim(),
      sectionIndex: 0,
      type: "text",
    });
  }

  return {
    title,
    content: text,
    sections,
    metadata: {
      format: "markdown",
      wordCount: text.split(/\s+/).filter(Boolean).length,
      charCount: text.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Plain Text Parser
// ---------------------------------------------------------------------------

function parsePlainText(buffer: Buffer, fileName: string): ParsedDocument {
  const text = buffer.toString("utf-8");
  const title = fileName.replace(/\.[^.]+$/, "");

  // Split on double newlines (paragraph boundaries)
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim());

  const sections: DocumentSection[] = [];
  const PARAGRAPHS_PER_SECTION = 5;

  for (let i = 0; i < paragraphs.length; i += PARAGRAPHS_PER_SECTION) {
    const batch = paragraphs.slice(i, i + PARAGRAPHS_PER_SECTION);
    sections.push({
      content: batch.join("\n\n"),
      sectionIndex: sections.length,
      type: "text",
    });
  }

  if (sections.length === 0 && text.trim()) {
    sections.push({
      content: text.trim(),
      sectionIndex: 0,
      type: "text",
    });
  }

  return {
    title,
    content: text,
    sections,
    metadata: {
      format: "text",
      wordCount: text.split(/\s+/).filter(Boolean).length,
      charCount: text.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Table detection utility (used by PDF parser)
// ---------------------------------------------------------------------------

interface TextRegion {
  content: string;
  heading?: string;
  type: "text" | "table";
}

/**
 * Detect tabular regions in extracted PDF text.
 * Heuristics:
 *   - Lines with pipe (|) delimiters
 *   - Lines with separator rows (---+--- or === patterns)
 *   - Runs of lines with consistent multi-space column alignment
 */
function splitTextAndTables(text: string): TextRegion[] {
  const lines = text.split("\n");
  const regions: TextRegion[] = [];
  let currentText = "";
  let currentTable = "";
  let tableHeading: string | undefined;
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTableLine = isLikelyTableRow(line);

    if (isTableLine && !inTable) {
      // Entering a table region — flush text
      if (currentText.trim()) {
        regions.push({ content: currentText.trim(), type: "text" });
        // Use last non-empty text line as table context heading
        const textLines = currentText.trim().split("\n").filter((l) => l.trim());
        tableHeading = textLines[textLines.length - 1]?.trim();
      }
      currentText = "";
      inTable = true;
      currentTable = line + "\n";
    } else if (isTableLine && inTable) {
      currentTable += line + "\n";
    } else if (!isTableLine && inTable) {
      // Exiting table — flush it
      if (currentTable.trim()) {
        const markdown = convertToMarkdownTable(currentTable.trim());
        regions.push({
          content: markdown,
          heading: tableHeading,
          type: "table",
        });
      }
      currentTable = "";
      inTable = false;
      tableHeading = undefined;
      currentText += line + "\n";
    } else {
      currentText += line + "\n";
    }
  }

  // Flush remaining
  if (inTable && currentTable.trim()) {
    const markdown = convertToMarkdownTable(currentTable.trim());
    regions.push({ content: markdown, heading: tableHeading, type: "table" });
  }
  if (currentText.trim()) {
    regions.push({ content: currentText.trim(), type: "text" });
  }

  // If nothing was split into tables, return original as single text region
  if (regions.length === 0 && text.trim()) {
    return [{ content: text.trim(), type: "text" }];
  }

  return regions;
}

function isLikelyTableRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Pipe-delimited rows: "| col1 | col2 |" or "col1 | col2"
  if ((trimmed.match(/\|/g) || []).length >= 2) return true;

  // Separator rows: "---+---", "---|---", "===+===", "--- --- ---"
  if (/^[-=+|:\s]{5,}$/.test(trimmed) && /[-=]{3,}/.test(trimmed)) return true;

  // Tab-delimited with 3+ columns
  if ((trimmed.match(/\t/g) || []).length >= 2) return true;

  // Multi-space aligned columns (3+ columns separated by 2+ spaces)
  const multiSpaceCols = trimmed.split(/\s{2,}/).filter(Boolean);
  if (multiSpaceCols.length >= 3 && trimmed.length > 20) return true;

  return false;
}

function convertToMarkdownTable(tableText: string): string {
  const lines = tableText.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return tableText;

  // Already pipe-delimited — clean up and ensure proper Markdown format
  if (lines[0].includes("|")) {
    const rows = lines
      .filter((l) => !/^[-=+|:\s]+$/.test(l.trim())) // skip separator rows
      .map((l) => {
        const cells = l.split("|").map((c) => c.trim()).filter(Boolean);
        return "| " + cells.join(" | ") + " |";
      });

    if (rows.length >= 1) {
      const colCount = (rows[0].match(/\|/g) || []).length - 1;
      const separator = "| " + Array(colCount).fill("---").join(" | ") + " |";
      return [rows[0], separator, ...rows.slice(1)].join("\n");
    }
  }

  // Tab or multi-space delimited — convert to pipe table
  const delimiter = lines[0].includes("\t") ? /\t+/ : /\s{2,}/;
  const rows = lines.map((l) => {
    const cells = l.split(delimiter).map((c) => c.trim()).filter(Boolean);
    return "| " + cells.join(" | ") + " |";
  });

  if (rows.length >= 1) {
    const colCount = (rows[0].match(/\|/g) || []).length - 1;
    const separator = "| " + Array(Math.max(colCount, 1)).fill("---").join(" | ") + " |";
    return [rows[0], separator, ...rows.slice(1)].join("\n");
  }

  return tableText;
}

// ---------------------------------------------------------------------------
// Heading splitter utility (used by PDF and fallback cases)
// ---------------------------------------------------------------------------

interface SubSection {
  content: string;
  heading?: string;
  type: "text" | "heading";
}

function splitOnHeadings(text: string): SubSection[] {
  // Detect heading-like patterns:
  // - ALL CAPS lines (>3 words)
  // - Lines ending with colon
  // - Lines that are short and followed by longer text
  const lines = text.split("\n");
  const results: SubSection[] = [];
  let currentHeading: string | undefined;
  let currentContent = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      currentContent += "\n";
      continue;
    }

    const isHeading =
      // ALL CAPS line with 2+ words
      (/^[A-Z][A-Z\s\d:&-]{5,}$/.test(trimmed) && trimmed.split(/\s+/).length >= 2) ||
      // Short line ending with colon
      (trimmed.endsWith(":") && trimmed.length < 80) ||
      // Numbered heading like "1. Introduction" or "1.1 Overview"
      /^\d+(\.\d+)*\.?\s+[A-Z]/.test(trimmed) && trimmed.length < 100;

    if (isHeading) {
      if (currentContent.trim()) {
        results.push({
          content: currentContent.trim(),
          heading: currentHeading,
          type: "text",
        });
      }
      currentHeading = trimmed.replace(/:$/, "");
      currentContent = "";
    } else {
      currentContent += trimmed + "\n";
    }
  }

  if (currentContent.trim()) {
    results.push({
      content: currentContent.trim(),
      heading: currentHeading,
      type: "text",
    });
  }

  // If nothing was split, return the whole text as one section
  if (results.length === 0 && text.trim()) {
    results.push({ content: text.trim(), type: "text" });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Main parse dispatcher
// ---------------------------------------------------------------------------

export async function parseDocument(
  buffer: Buffer,
  fileName: string,
  formatOverride?: string,
): Promise<ParsedDocument> {
  const format = formatOverride || detectFormat(fileName);

  switch (format) {
    case "pdf":
      return parsePdf(buffer, fileName);
    case "docx":
      return parseDocx(buffer, fileName);
    case "mhtml":
      return parseMhtmlDoc(buffer, fileName);
    case "csv":
      return parseCsv(buffer, fileName);
    case "markdown":
      return parseMarkdown(buffer, fileName);
    case "text":
    default:
      return parsePlainText(buffer, fileName);
  }
}
