/**
 * Vision Describer
 *
 * Uses Google Gemini Vision API to:
 *  1. OCR scanned PDFs — transcribe text from page images
 *  2. Describe images — generate text descriptions for embedded images
 *
 * This approach avoids native dependencies (canvas, pdfjs-dist) by
 * sending the raw PDF buffer to Gemini's multimodal API, which can
 * process PDF files directly.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const VISION_MODEL = "gemini-2.0-flash";

interface VisionResult {
  text: string;
  pageCount?: number;
  isOcr: boolean;
}

/**
 * Send a PDF to Gemini Vision for text extraction (OCR fallback).
 * Gemini can process PDFs natively — no need to render pages to images.
 */
export async function ocrPdfWithVision(
  buffer: Buffer,
  fileName: string,
): Promise<VisionResult> {
  if (!GEMINI_API_KEY) {
    throw new Error("No GEMINI_API_KEY set — cannot run OCR via Vision API");
  }

  const base64 = buffer.toString("base64");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${VISION_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64,
              },
            },
            {
              text: `Extract ALL text content from this PDF document. Preserve the document structure including headings, paragraphs, lists, and tables. For tables, use Markdown pipe-table format. For each page, indicate the page number with "--- Page N ---" markers. Return only the extracted text, no commentary.`,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 32768,
        temperature: 0,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini Vision OCR error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    candidates: { content: { parts: { text: string }[] } }[];
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const pageMarkers = text.match(/---\s*Page\s*\d+\s*---/gi);

  return {
    text,
    pageCount: pageMarkers?.length,
    isOcr: true,
  };
}

/**
 * Describe images in a PDF using Gemini Vision.
 * Sends the PDF and asks for descriptions of visual elements.
 */
export async function describeDocumentImages(
  buffer: Buffer,
  fileName: string,
): Promise<{ page: number; description: string }[]> {
  if (!GEMINI_API_KEY) {
    return [];
  }

  const base64 = buffer.toString("base64");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${VISION_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64,
              },
            },
            {
              text: `Identify all diagrams, charts, screenshots, figures, and significant images in this PDF. For each, provide:
PAGE: <page number>
DESCRIPTION: <detailed description of what the image shows, including any visible text, data, labels, or relationships>

If there are no significant images, respond with "NO_IMAGES".
Do not describe decorative elements like logos, page borders, or background patterns.`,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 16384,
        temperature: 0,
      },
    }),
  });

  if (!res.ok) {
    console.warn(`Image description API failed (${res.status})`);
    return [];
  }

  const data = (await res.json()) as {
    candidates: { content: { parts: { text: string }[] } }[];
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  if (text.includes("NO_IMAGES")) return [];

  // Parse the PAGE/DESCRIPTION pairs
  const results: { page: number; description: string }[] = [];
  const blocks = text.split(/(?=PAGE:\s*\d+)/i);

  for (const block of blocks) {
    const pageMatch = block.match(/PAGE:\s*(\d+)/i);
    const descMatch = block.match(/DESCRIPTION:\s*([\s\S]+?)(?=PAGE:|$)/i);
    if (pageMatch && descMatch) {
      results.push({
        page: parseInt(pageMatch[1]),
        description: descMatch[1].trim(),
      });
    }
  }

  return results;
}
