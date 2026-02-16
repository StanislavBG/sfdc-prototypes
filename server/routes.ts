import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { SalesforceCrawler, chunkArticleContent, parseArticleUrl, extractArticleFromUrl } from "./crawler";
import type { CrawledArticle } from "./crawler";

// Shared crawler instance (persists across requests for progress tracking)
let activeCrawler = new SalesforceCrawler();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.greeting.get.path, async (_req, res) => {
    const greeting = await storage.getGreeting();
    res.json({ message: greeting?.message || "Hello World" });
  });

  app.get(api.documents.list.path, async (_req, res) => {
    const docs = await storage.listDocuments();
    res.json(docs);
  });

  app.post(api.documents.insert.path, async (req, res) => {
    try {
      const input = api.documents.insert.input.parse(req.body);
      const doc = await storage.insertDocument(input);
      res.status(201).json(doc);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.documents.delete.path, async (req, res) => {
    await storage.deleteDocument(Number(req.params.id));
    res.status(204).send();
  });

  app.post(api.documents.query.path, async (req, res) => {
    try {
      const input = api.documents.query.input.parse(req.body);
      const results = await storage.queryDocuments(input.query, input.limit);
      res.json(results);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // =========================================================================
  // Crawler / Article endpoints
  // =========================================================================

  /** Start a background crawl from seed URLs */
  app.post(api.crawler.start.path, async (req, res) => {
    try {
      const input = api.crawler.start.input.parse(req.body);

      // Create a fresh crawler with the given options
      activeCrawler = new SalesforceCrawler({
        maxDepth: input.maxDepth,
        maxArticles: input.maxArticles,
        delayMs: input.delayMs,
        articleIdPrefix: input.articleIdPrefix,
      });

      // Pre-load article IDs already in the DB so the crawler skips them
      const existingIds = await storage.listArticleIds();
      if (existingIds.length > 0) {
        activeCrawler.preloadVisited(existingIds);
        activeCrawler.incrementSkipped(existingIds.length);
        console.log(`Crawler: skipping ${existingIds.length} articles already in DB`);
      }

      // Fire the crawl in the background — don't await
      (async () => {
        try {
          const articles = await activeCrawler.crawl(input.urls);
          // Store each article's chunks in the vector DB
          // Only store articles that have real content (skip preloaded stubs)
          for (const article of articles) {
            if (!article.content && !article.title) continue; // stub from preload
            const chunks = chunkArticleContent(article);
            const stored = await storage.upsertArticleChunks(article.articleId, chunks);
            activeCrawler.incrementStored(stored);
          }
        } catch (err: any) {
          console.error("Crawl error:", err);
        }
      })();

      res.json({ message: `Crawl started for ${input.urls.length} seed URL(s)` });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  /** Import articles directly (structured data, no crawling) */
  app.post(api.crawler.import.path, async (req, res) => {
    try {
      const input = api.crawler.import.input.parse(req.body);
      let totalChunks = 0;

      for (const data of input.articles) {
        const article = activeCrawler.importArticle(data);
        const chunks = chunkArticleContent(article);
        const stored = await storage.upsertArticleChunks(article.articleId, chunks);
        totalChunks += stored;
      }

      res.json({ imported: input.articles.length, chunksStored: totalChunks });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  /** Import raw HTML for a specific article URL */
  app.post(api.crawler.importHtml.path, async (req, res) => {
    try {
      const input = api.crawler.importHtml.input.parse(req.body);
      const article = activeCrawler.importHtml(input.url, input.html);

      if (!article) {
        return res.status(400).json({ message: "Could not parse article URL" });
      }

      const chunks = chunkArticleContent(article);
      const stored = await storage.upsertArticleChunks(article.articleId, chunks);

      res.json({
        articleId: article.articleId,
        title: article.title,
        chunksStored: stored,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  /** Get crawl progress */
  app.get(api.crawler.progress.path, async (_req, res) => {
    res.json(activeCrawler.getProgress());
  });

  /** List all stored articles (from DB) */
  app.get(api.crawler.articles.path, async (_req, res) => {
    const articles = await storage.listArticles();
    res.json(articles);
  });

  /** Get article tree structure (from DB) */
  app.get(api.crawler.tree.path, async (_req, res) => {
    const tree = await storage.getArticleTree();
    res.json(tree);
  });

  /** Semantic search across Salesforce docs */
  app.post(api.crawler.query.path, async (req, res) => {
    try {
      const input = api.crawler.query.input.parse(req.body);
      const results = await storage.queryArticles(input.query, input.limit);
      res.json(results);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  /** Delete an article and all its chunks */
  app.delete(api.crawler.deleteArticle.path, async (req, res) => {
    const articleId = req.params.articleId;
    const deleted = await storage.deleteArticle(articleId);
    res.json({ deleted });
  });

  /** Extract article content from a URL (preview, no storage) */
  app.post(api.crawler.extract.path, async (req, res) => {
    try {
      const input = api.crawler.extract.input.parse(req.body);
      const extracted = await extractArticleFromUrl(input.url);
      res.json(extracted);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Extract error:", err);
      return res.status(500).json({ message: err.message || "Failed to extract article" });
    }
  });

  /** Save previously extracted content to the database */
  app.post(api.crawler.saveExtracted.path, async (req, res) => {
    try {
      const input = api.crawler.saveExtracted.input.parse(req.body);

      // Generate a stable article ID from the URL
      const urlHash = input.url.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 80);
      const articleId = `ext_${urlHash}`;

      const article: CrawledArticle = {
        articleId,
        title: input.title,
        url: input.url,
        parentId: null,
        breadcrumb: [],
        children: [],
        content: input.content,
        sections: input.sections,
      };

      const chunks = chunkArticleContent(article);
      const stored = await storage.upsertArticleChunks(articleId, chunks);

      res.json({
        articleId,
        title: input.title,
        chunksStored: stored,
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Save extracted error:", err);
      return res.status(500).json({ message: err.message || "Failed to save article" });
    }
  });

  const existing = await storage.getGreeting();
  if (!existing) {
    await storage.createGreeting({ message: "Hello World" });
  }

  return httpServer;
}
