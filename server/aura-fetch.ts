/**
 * Salesforce Aura API article fetcher.
 *
 * Fetches a single Salesforce Help article via one POST to
 * https://help.salesforce.com/s/sfsites/aura
 *
 * Usage:
 *   const article = await fetchArticle("sf.c360_a_identity_resolution");
 *   // => { articleId, title, content, url }
 *
 * The aura.context fwuid may rotate when Salesforce deploys.
 * If fetches start returning 200-but-empty or 400, grab a fresh
 * fwuid from DevTools (Network → sfsites/aura → Form Data → aura.context).
 */

import * as cheerio from "cheerio";

// ---------------------------------------------------------------------------
// Config — paste fresh values from DevTools when they rotate
// ---------------------------------------------------------------------------

const AURA_ENDPOINT = "https://help.salesforce.com/s/sfsites/aura";

/**
 * aura.context changes when Salesforce redeploys.
 * Copy the full JSON string from DevTools → Network → any aura request → Form Data.
 */
const AURA_CONTEXT = JSON.stringify({
  mode: "PROD",
  fwuid: "REPLACE_FROM_DEVTOOLS",
  app: "siteforce:communityApp",
  loaded: {},
  dn: [],
  globals: {},
  uad: false,
});

/** Guest token — usually the literal string "undefined" for public pages. */
const AURA_TOKEN = "undefined";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FetchedArticle {
  articleId: string;
  title: string;
  /** Cleaned text content of the article */
  content: string;
  /** Raw HTML body from div#content.slds-text-longform */
  html: string;
  url: string;
}

// ---------------------------------------------------------------------------
// HTML extraction — matches the rendered DOM structure
// ---------------------------------------------------------------------------

/**
 * Extract title + body from article HTML.
 *
 * Rendered DOM structure (from DevTools):
 *   div#content.slds-text-longform
 *     h1.slds-text-heading_large   ← title
 *     p, ul, div.slds-box, ...     ← body
 */
function extractFromHtml(html: string, fallbackTitle: string): { title: string; content: string; html: string } {
  const $ = cheerio.load(html);

  // Primary selector: the article content container
  const container = $("div#content.slds-text-longform");
  if (container.length === 0) {
    // Fallback: try any .slds-text-longform or the full body
    const fallback = $(".slds-text-longform").first();
    const rawHtml = fallback.length ? fallback.html()! : html;
    const rawText = fallback.length ? fallback.text().trim() : $.text().trim();
    return { title: fallbackTitle, content: rawText, html: rawHtml };
  }

  const title = container.find("h1.slds-text-heading_large").first().text().trim() || fallbackTitle;

  // Remove the h1 from the clone so content is body-only
  const bodyClone = container.clone();
  bodyClone.find("h1.slds-text-heading_large").remove();

  return {
    title,
    content: bodyClone.text().replace(/\s+/g, " ").trim(),
    html: bodyClone.html()?.trim() ?? "",
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function articleUrl(articleId: string): string {
  return `https://help.salesforce.com/s/articleView?id=${articleId}.htm&type=5`;
}

/**
 * Build the `message` JSON for a KnowledgeArticle Aura action.
 *
 * Replace the descriptor below with the one you capture from DevTools.
 */
function buildMessage(articleId: string): string {
  return JSON.stringify({
    actions: [
      {
        id: "1;a",
        descriptor:
          "apex://KnowledgeArticleController/ACTION$getArticleById",
        callingDescriptor: "UNKNOWN",
        params: {
          articleId,
        },
      },
    ],
  });
}

/**
 * Walk an Aura response JSON deeply to find any string that looks like
 * HTML containing our target selectors. Aura nests results in varying
 * shapes — this brute-force walk handles all of them.
 */
function findHtmlInResponse(obj: unknown): string | null {
  if (typeof obj === "string") {
    if (obj.includes("slds-text-longform") || obj.includes('id="content"')) {
      return obj;
    }
    return null;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findHtmlInResponse(item);
      if (found) return found;
    }
    return null;
  }
  if (obj && typeof obj === "object") {
    for (const val of Object.values(obj)) {
      const found = findHtmlInResponse(val);
      if (found) return found;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch a single Salesforce Help article via the Aura API.
 *
 * @param articleId  e.g. "sf.c360_a_identity_resolution"
 * @param overrides  Optional overrides for context/token/descriptor
 */
export async function fetchArticle(
  articleId: string,
  overrides?: { context?: string; token?: string; descriptor?: string }
): Promise<FetchedArticle> {
  const message = overrides?.descriptor
    ? JSON.stringify({
        actions: [
          {
            id: "1;a",
            descriptor: overrides.descriptor,
            callingDescriptor: "UNKNOWN",
            params: { articleId },
          },
        ],
      })
    : buildMessage(articleId);

  const body = new URLSearchParams({
    message,
    "aura.context": overrides?.context ?? AURA_CONTEXT,
    "aura.token": overrides?.token ?? AURA_TOKEN,
  });

  const res = await fetch(AURA_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Aura fetch failed (${res.status}): ${text.slice(0, 300)}`
    );
  }

  const json = await res.json();

  // Strategy 1: walk actions[0].returnValue for known field names
  const actionResult = json?.actions?.[0]?.returnValue;

  let rawHtml: string | null = null;

  if (actionResult) {
    // Check common field names for article HTML
    rawHtml =
      actionResult.body ??
      actionResult.Body ??
      actionResult.articleBody ??
      actionResult.content ??
      actionResult.Content ??
      null;
  }

  // Strategy 2: deep-walk the entire response for HTML containing our selectors
  if (!rawHtml) {
    rawHtml = findHtmlInResponse(json);
  }

  if (!rawHtml) {
    throw new Error(
      `Could not find article HTML in Aura response. Top-level keys: ${Object.keys(json).join(", ")}. ` +
      `Dump first 500 chars: ${JSON.stringify(json).slice(0, 500)}`
    );
  }

  // Parse the HTML with cheerio to extract structured content
  const extracted = extractFromHtml(rawHtml, articleId);

  return {
    articleId,
    title: extracted.title,
    content: extracted.content,
    html: extracted.html,
    url: articleUrl(articleId),
  };
}

/**
 * Fetch multiple articles sequentially with a polite delay.
 */
export async function fetchArticles(
  articleIds: string[],
  delayMs = 500,
  overrides?: { context?: string; token?: string; descriptor?: string }
): Promise<{ results: FetchedArticle[]; errors: { id: string; error: string }[] }> {
  const results: FetchedArticle[] = [];
  const errors: { id: string; error: string }[] = [];

  for (const id of articleIds) {
    try {
      const article = await fetchArticle(id, overrides);
      results.push(article);
    } catch (err) {
      errors.push({ id, error: err instanceof Error ? err.message : String(err) });
    }
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return { results, errors };
}
