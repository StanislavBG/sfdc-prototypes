import * as cheerio from "cheerio";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ArticleNode {
  articleId: string;
  title: string;
  url: string;
  parentId: string | null;
  breadcrumb: string[];
  children: string[]; // child articleIds
}

export interface CrawledArticle extends ArticleNode {
  content: string; // plain-text content extracted from the page
  sections: ArticleSection[];
}

export interface ArticleSection {
  heading: string;
  body: string;
}

export interface CrawlOptions {
  /** Maximum depth to crawl from the seed URL (0 = seed only) */
  maxDepth: number;
  /** Delay between requests in ms (be respectful) */
  delayMs: number;
  /** Maximum total articles to crawl */
  maxArticles: number;
  /** Only follow links matching this article-ID prefix */
  articleIdPrefix: string;
}

export interface CrawlProgress {
  status: "idle" | "running" | "completed" | "error";
  total: number;
  crawled: number;
  stored: number;
  errors: string[];
  startedAt: string | null;
  completedAt: string | null;
}

// ---------------------------------------------------------------------------
// Helpers — URL / article-ID parsing
// ---------------------------------------------------------------------------

const SF_HELP_BASE = "https://help.salesforce.com";

/**
 * Normalise various Salesforce help URL forms into a canonical URL and
 * extract the article ID.
 *
 * Accepted patterns:
 *   help.salesforce.com/s/articleView?id=data.ARTICLE_ID.htm&type=5
 *   help.salesforce.com/s/articleView?id=sf.ARTICLE_ID.htm&type=5
 */
export function parseArticleUrl(raw: string): { articleId: string; url: string } | null {
  try {
    const u = new URL(raw.trim());
    const id = u.searchParams.get("id");
    if (!id) return null;

    // Strip namespace prefix (data. / sf.) and .htm suffix
    const cleaned = id
      .replace(/^(data|sf)\./, "")
      .replace(/\.htm$/, "");

    if (!cleaned) return null;

    // Rebuild canonical URL with the data. namespace
    const canonical = `${SF_HELP_BASE}/s/articleView?id=data.${cleaned}.htm&type=5`;
    return { articleId: cleaned, url: canonical };
  } catch {
    return null;
  }
}

/**
 * Build a canonical article URL from an article ID.
 */
export function articleIdToUrl(articleId: string): string {
  return `${SF_HELP_BASE}/s/articleView?id=data.${articleId}.htm&type=5`;
}

/**
 * Guess the parent article ID from the naming convention.
 * e.g.  c360_a_identity_resolution_unify_source_profiles
 *    →  c360_a_identity_resolution
 */
export function guessParentId(articleId: string): string | null {
  const parts = articleId.split("_");
  if (parts.length <= 2) return null;
  // Walk backwards to find a valid truncation point
  return parts.slice(0, -1).join("_") || null;
}

// ---------------------------------------------------------------------------
// HTML parsing — extract article content and navigation links
// ---------------------------------------------------------------------------

/**
 * Parse Salesforce Help HTML and extract article content.
 *
 * The Help site is rendered client-side (Lightning Web Runtime), so when
 * fetching with a simple HTTP client the HTML may contain only a loading
 * shell. This parser handles both cases:
 *
 *   1. **Full HTML** (from a headless browser / saved page) → extracts the
 *      article body, breadcrumb, and sidebar nav links.
 *   2. **Shell HTML** (from a plain fetch) → falls back to embedded JSON-LD,
 *      <meta> tags, or aura bootstrap data if present.
 */
export function parseArticleHtml(
  html: string,
  sourceUrl: string
): { article: Partial<CrawledArticle>; childLinks: string[] } {
  const $ = cheerio.load(html);
  const childLinks: string[] = [];

  // ---- 1. Try full rendered content (headless browser or saved HTML) ----

  // Article title
  let title =
    $("h1.article-title").first().text().trim() ||
    $("h1").first().text().trim() ||
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("title").text().trim() ||
    "";

  // Breadcrumb
  const breadcrumb: string[] = [];
  $(".breadcrumbs a, .slds-breadcrumb a, nav[aria-label='Breadcrumb'] a").each(
    (_i, el) => {
      const t = $(el).text().trim();
      if (t) breadcrumb.push(t);
    }
  );

  // Article body text
  let bodyText = "";
  const sections: ArticleSection[] = [];

  // Try common Salesforce Help article content selectors
  const contentSelectors = [
    ".article-content",
    ".articleBody",
    '[data-aura-rendered-by*="article"]',
    ".cHelpDocContent",
    ".content-wrapper",
    "article",
    "main",
  ];

  for (const sel of contentSelectors) {
    const el = $(sel).first();
    if (el.length && el.text().trim().length > 100) {
      // Extract sections by heading
      el.find("h2, h3, h4").each((_i, heading) => {
        const headingText = $(heading).text().trim();
        // Collect text until next heading
        let sectionBody = "";
        let sibling = $(heading).next();
        while (
          sibling.length &&
          !sibling.is("h2, h3, h4")
        ) {
          sectionBody += sibling.text().trim() + "\n";
          sibling = sibling.next();
        }
        if (headingText && sectionBody.trim()) {
          sections.push({ heading: headingText, body: sectionBody.trim() });
        }
      });

      bodyText = el.text().trim();
      break;
    }
  }

  // ---- 2. Fallback: look for JSON-LD or meta description ----
  if (!bodyText) {
    $('script[type="application/ld+json"]').each((_i, el) => {
      try {
        const ld = JSON.parse($(el).html() || "");
        if (ld.articleBody) bodyText = ld.articleBody;
        if (ld.name && !title) title = ld.name;
      } catch {
        /* ignore */
      }
    });
  }
  if (!bodyText) {
    bodyText =
      $('meta[name="description"]').attr("content")?.trim() ||
      $('meta[property="og:description"]').attr("content")?.trim() ||
      "";
  }

  // ---- 3. Extract navigation / child links ----
  $("a[href]").each((_i, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    // Resolve relative URLs
    let absoluteUrl: string;
    try {
      absoluteUrl = new URL(href, sourceUrl).toString();
    } catch {
      return;
    }

    // Only keep help article links
    if (
      absoluteUrl.includes("help.salesforce.com") &&
      absoluteUrl.includes("articleView")
    ) {
      const parsed = parseArticleUrl(absoluteUrl);
      if (parsed) childLinks.push(parsed.url);
    }
  });

  const parsedSource = parseArticleUrl(sourceUrl);
  const articleId = parsedSource?.articleId || "";

  return {
    article: {
      articleId,
      title: title || articleId,
      url: sourceUrl,
      parentId: guessParentId(articleId),
      breadcrumb,
      content: bodyText,
      sections,
      children: [],
    },
    childLinks: Array.from(new Set(childLinks)), // deduplicate
  };
}

// ---------------------------------------------------------------------------
// Fetch strategies
// ---------------------------------------------------------------------------

type FetchStrategy = (url: string) => Promise<string>;

/**
 * Strategy 1: Plain HTTP fetch. Works for pre-rendered / cached pages.
 */
export const fetchDirect: FetchStrategy = async (url: string) => {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
};

/**
 * Strategy 2: Google web-cache — sometimes serves a fully rendered snapshot.
 */
export const fetchViaCache: FetchStrategy = async (url: string) => {
  const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`;
  return fetchDirect(cacheUrl);
};

// ---------------------------------------------------------------------------
// Crawler class
// ---------------------------------------------------------------------------

const DEFAULT_OPTIONS: CrawlOptions = {
  maxDepth: 3,
  delayMs: 1500,
  maxArticles: 100,
  articleIdPrefix: "c360_a",
};

export class SalesforceCrawler {
  private visited = new Map<string, CrawledArticle>(); // articleId → article
  private queue: { url: string; depth: number }[] = [];
  private progress: CrawlProgress = {
    status: "idle",
    total: 0,
    crawled: 0,
    stored: 0,
    errors: [],
    startedAt: null,
    completedAt: null,
  };
  private options: CrawlOptions;
  private fetchFn: FetchStrategy;

  constructor(
    options: Partial<CrawlOptions> = {},
    fetchStrategy?: FetchStrategy
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.fetchFn = fetchStrategy || fetchDirect;
  }

  getProgress(): CrawlProgress {
    return { ...this.progress };
  }

  getArticles(): CrawledArticle[] {
    return Array.from(this.visited.values());
  }

  getTree(): ArticleNode[] {
    return this.getArticles().map(({ content, sections, ...node }) => node);
  }

  /**
   * Start crawling from a seed URL (or list of seed URLs).
   * Returns all crawled articles.
   */
  async crawl(seedUrls: string | string[]): Promise<CrawledArticle[]> {
    const seeds = Array.isArray(seedUrls) ? seedUrls : [seedUrls];

    this.progress = {
      status: "running",
      total: seeds.length,
      crawled: 0,
      stored: 0,
      errors: [],
      startedAt: new Date().toISOString(),
      completedAt: null,
    };

    // Seed the queue
    for (const raw of seeds) {
      const parsed = parseArticleUrl(raw);
      if (parsed) {
        this.queue.push({ url: parsed.url, depth: 0 });
      }
    }

    // BFS crawl
    while (this.queue.length > 0) {
      if (this.visited.size >= this.options.maxArticles) break;

      const { url, depth } = this.queue.shift()!;
      const parsed = parseArticleUrl(url);
      if (!parsed) continue;

      // Skip already-visited
      if (this.visited.has(parsed.articleId)) continue;

      // Skip articles outside the allowed prefix
      if (
        this.options.articleIdPrefix &&
        !parsed.articleId.startsWith(this.options.articleIdPrefix)
      ) {
        continue;
      }

      try {
        const html = await this.fetchFn(url);
        const { article, childLinks } = parseArticleHtml(html, url);

        const crawled: CrawledArticle = {
          articleId: parsed.articleId,
          title: article.title || parsed.articleId,
          url: parsed.url,
          parentId: article.parentId || guessParentId(parsed.articleId),
          breadcrumb: article.breadcrumb || [],
          children: [],
          content: article.content || "",
          sections: article.sections || [],
        };

        this.visited.set(parsed.articleId, crawled);
        this.progress.crawled++;
        this.progress.total = Math.max(
          this.progress.total,
          this.visited.size + this.queue.length
        );

        // Enqueue children
        if (depth < this.options.maxDepth) {
          for (const childUrl of childLinks) {
            const childParsed = parseArticleUrl(childUrl);
            if (childParsed && !this.visited.has(childParsed.articleId)) {
              this.queue.push({ url: childUrl, depth: depth + 1 });
              crawled.children.push(childParsed.articleId);
            }
          }
        }
      } catch (err: any) {
        this.progress.errors.push(`${parsed.articleId}: ${err.message}`);
      }

      // Rate limiting
      if (this.queue.length > 0) {
        await sleep(this.options.delayMs);
      }
    }

    // Build parent→child relationships from naming convention
    this.resolveParentChildRelationships();

    this.progress.status = "completed";
    this.progress.completedAt = new Date().toISOString();
    return this.getArticles();
  }

  /**
   * Import pre-fetched HTML content for an article (bypass network fetch).
   * Use this to import pages saved from a browser.
   */
  importHtml(url: string, html: string): CrawledArticle | null {
    const parsed = parseArticleUrl(url);
    if (!parsed) return null;

    const { article } = parseArticleHtml(html, url);
    const crawled: CrawledArticle = {
      articleId: parsed.articleId,
      title: article.title || parsed.articleId,
      url: parsed.url,
      parentId: article.parentId || guessParentId(parsed.articleId),
      breadcrumb: article.breadcrumb || [],
      children: article.children || [],
      content: article.content || "",
      sections: article.sections || [],
    };

    this.visited.set(parsed.articleId, crawled);
    return crawled;
  }

  /**
   * Import an article directly from structured data (no HTML parsing needed).
   * Use this for manual/bulk import of article content.
   */
  importArticle(data: {
    articleId: string;
    title: string;
    url?: string;
    content: string;
    parentId?: string;
    breadcrumb?: string[];
  }): CrawledArticle {
    const crawled: CrawledArticle = {
      articleId: data.articleId,
      title: data.title,
      url: data.url || articleIdToUrl(data.articleId),
      parentId: data.parentId || guessParentId(data.articleId),
      breadcrumb: data.breadcrumb || [],
      children: [],
      content: data.content,
      sections: [],
    };

    this.visited.set(data.articleId, crawled);
    return crawled;
  }

  /**
   * After crawling, resolve parent→child edges from ID naming convention
   * so the tree is consistent even if we didn't find all links in the HTML.
   */
  private resolveParentChildRelationships(): void {
    const all = Array.from(this.visited.values());
    for (const article of all) {
      if (article.parentId && this.visited.has(article.parentId)) {
        const parent = this.visited.get(article.parentId)!;
        if (!parent.children.includes(article.articleId)) {
          parent.children.push(article.articleId);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Chunk article content into pieces suitable for embedding.
 * Each chunk is ≤ maxTokens characters (rough proxy for tokens).
 * Chunks overlap to preserve context across boundaries.
 */
export function chunkArticleContent(
  article: CrawledArticle,
  maxChars: number = 2000,
  overlapChars: number = 200
): { content: string; metadata: Record<string, unknown> }[] {
  const chunks: { content: string; metadata: Record<string, unknown> }[] = [];

  const baseMetadata = {
    type: "salesforce_doc",
    article_id: article.articleId,
    title: article.title,
    url: article.url,
    parent_id: article.parentId,
    breadcrumb: article.breadcrumb,
    source: "help.salesforce.com",
  };

  // Strategy 1: Chunk by sections if available
  if (article.sections.length > 0) {
    for (const section of article.sections) {
      const sectionText = `# ${article.title}\n## ${section.heading}\n\n${section.body}`;
      if (sectionText.length <= maxChars) {
        chunks.push({
          content: sectionText,
          metadata: { ...baseMetadata, section: section.heading, chunk_strategy: "section" },
        });
      } else {
        // Sub-chunk long sections
        const subChunks = splitTextWithOverlap(sectionText, maxChars, overlapChars);
        subChunks.forEach((chunk, i) => {
          chunks.push({
            content: chunk,
            metadata: {
              ...baseMetadata,
              section: section.heading,
              chunk_index: i,
              chunk_strategy: "section_split",
            },
          });
        });
      }
    }
  }

  // Strategy 2: Chunk the full content (fallback or in addition to sections)
  if (chunks.length === 0 && article.content) {
    const fullText = `# ${article.title}\n\n${article.content}`;
    if (fullText.length <= maxChars) {
      chunks.push({
        content: fullText,
        metadata: { ...baseMetadata, chunk_strategy: "full" },
      });
    } else {
      const subChunks = splitTextWithOverlap(fullText, maxChars, overlapChars);
      subChunks.forEach((chunk, i) => {
        chunks.push({
          content: chunk,
          metadata: {
            ...baseMetadata,
            chunk_index: i,
            chunk_strategy: "content_split",
          },
        });
      });
    }
  }

  // If no content at all, store at least the title + metadata
  if (chunks.length === 0) {
    chunks.push({
      content: `# ${article.title}\n\nSalesforce Help article: ${article.url}`,
      metadata: { ...baseMetadata, chunk_strategy: "title_only" },
    });
  }

  return chunks;
}

function splitTextWithOverlap(
  text: string,
  maxChars: number,
  overlapChars: number
): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlapChars;
    if (start >= text.length) break;
  }
  return chunks;
}
