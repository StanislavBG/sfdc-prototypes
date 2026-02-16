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
  /** Raw HTML body of the article */
  content: string;
  url: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function articleUrl(articleId: string): string {
  // Salesforce help articles follow this URL pattern
  return `https://help.salesforce.com/s/articleView?id=${articleId}.htm&type=5`;
}

/**
 * Build the `message` JSON for a KnowledgeArticle Aura action.
 *
 * The exact descriptor depends on the community's controllers.
 * Typical patterns seen in help.salesforce.com:
 *   - "apex://KnowledgeArticleController/ACTION$getArticleById"
 *   - "serviceComponent://ui.communities.components.aura.components.forceCommunity.controller.
 *      KnowledityArticleController/ACTION$getArticle"
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch a single Salesforce Help article via the Aura API.
 *
 * @param articleId  e.g. "sf.c360_a_identity_resolution"
 * @param overrides  Optional overrides for context/token (useful when
 *                   wiring up fresh values from DevTools)
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

  // Aura responses nest the result deeply. The exact path depends on the
  // controller's return shape. Walk the common patterns:
  const actionResult = json?.actions?.[0]?.returnValue;
  if (!actionResult) {
    throw new Error(
      `No returnValue in Aura response. Raw keys: ${Object.keys(json).join(", ")}`
    );
  }

  // Extract title + body HTML from the return value.
  // Adjust these property names once you see the real response shape.
  const title: string =
    actionResult.title ??
    actionResult.Title ??
    actionResult.articleTitle ??
    articleId;

  const content: string =
    actionResult.body ??
    actionResult.Body ??
    actionResult.articleBody ??
    actionResult.content ??
    JSON.stringify(actionResult);

  return {
    articleId,
    title,
    content,
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
