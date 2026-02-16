import * as cheerio from "cheerio";

/**
 * Parse an MHTML file and extract the plain-text content.
 *
 * MHTML files use MIME multipart encoding. We locate the text/html part,
 * decode it (quoted-printable or base64), then strip HTML to plain text.
 */
export function parseMhtml(buffer: Buffer): { title: string; content: string } {
  const raw = buffer.toString("utf-8");

  // 1. Extract the MIME boundary from the Content-Type header
  const boundaryMatch = raw.match(/boundary="?([^\s";]+)"?/i);
  if (!boundaryMatch) {
    // Not multipart — treat the whole thing as HTML
    return extractFromHtml(raw);
  }

  const boundary = boundaryMatch[1];
  const parts = raw.split(`--${boundary}`);

  // 2. Walk each MIME part and find the text/html section
  for (const part of parts) {
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) continue;

    const headers = part.slice(0, headerEnd);
    if (!/content-type:\s*text\/html/i.test(headers)) continue;

    let body = part.slice(headerEnd + 4);

    // Trim trailing boundary markers
    const endBoundary = body.indexOf(`--${boundary}`);
    if (endBoundary !== -1) body = body.slice(0, endBoundary);

    // Decode transfer encoding
    if (/content-transfer-encoding:\s*quoted-printable/i.test(headers)) {
      body = decodeQuotedPrintable(body);
    } else if (/content-transfer-encoding:\s*base64/i.test(headers)) {
      body = Buffer.from(body.replace(/\s/g, ""), "base64").toString("utf-8");
    }

    return extractFromHtml(body);
  }

  // Fallback: try treating the whole file as HTML
  return extractFromHtml(raw);
}

/**
 * Decode a quoted-printable encoded string.
 */
function decodeQuotedPrintable(input: string): string {
  return input
    // Soft line breaks (= at end of line)
    .replace(/=\r?\n/g, "")
    // Encoded characters (=XX hex)
    .replace(/=([0-9A-Fa-f]{2})/g, (_match, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
}

/**
 * Extract title and cleaned plain text from HTML.
 */
function extractFromHtml(html: string): { title: string; content: string } {
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
    "Untitled";

  // Try common content selectors first
  const contentSelectors = [
    ".article-content",
    ".articleBody",
    "article",
    '[role="main"]',
    "main",
    "#content",
    ".content-wrapper",
  ];

  let $content: ReturnType<typeof $> = $("body");
  for (const sel of contentSelectors) {
    const el = $(sel).first();
    if (el.length && el.text().trim().length > 200) {
      $content = el;
      break;
    }
  }

  // Normalize whitespace: collapse runs, keep paragraph breaks
  const content = $content
    .text()
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { title, content };
}
