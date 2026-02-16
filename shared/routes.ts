import { z } from 'zod';

export const api = {
  greeting: {
    get: {
      method: 'GET' as const,
      path: '/api/greeting' as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
  },
  documents: {
    list: {
      method: 'GET' as const,
      path: '/api/documents' as const,
      responses: {
        200: z.array(z.object({
          id: z.number(),
          content: z.string(),
          metadata: z.record(z.unknown()),
          created_at: z.string().nullable(),
        })),
      },
    },
    insert: {
      method: 'POST' as const,
      path: '/api/documents' as const,
      input: z.object({
        content: z.string().min(1),
        metadata: z.record(z.unknown()).optional(),
      }),
      responses: {
        201: z.object({
          id: z.number(),
          content: z.string(),
          metadata: z.record(z.unknown()),
          created_at: z.string().nullable(),
        }),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/documents/:id' as const,
      responses: {
        204: z.void(),
      },
    },
    query: {
      method: 'POST' as const,
      path: '/api/documents/query' as const,
      input: z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(20).optional(),
      }),
      responses: {
        200: z.array(z.object({
          id: z.number(),
          content: z.string(),
          metadata: z.record(z.unknown()),
          similarity: z.number(),
        })),
      },
    },
  },
  // ---- Crawler / Articles ----
  crawler: {
    /** Start a crawl from one or more seed URLs */
    start: {
      method: 'POST' as const,
      path: '/api/crawler/start' as const,
      input: z.object({
        urls: z.array(z.string().url()).min(1),
        maxDepth: z.number().min(0).max(5).optional(),
        maxArticles: z.number().min(1).max(500).optional(),
        delayMs: z.number().min(500).max(10000).optional(),
        articleIdPrefix: z.string().optional(),
      }),
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    /** Import article(s) directly (bypass crawling) */
    import: {
      method: 'POST' as const,
      path: '/api/crawler/import' as const,
      input: z.object({
        articles: z.array(z.object({
          articleId: z.string().min(1),
          title: z.string().min(1),
          url: z.string().optional(),
          content: z.string().min(1),
          parentId: z.string().optional(),
          breadcrumb: z.array(z.string()).optional(),
        })).min(1),
      }),
      responses: {
        200: z.object({
          imported: z.number(),
          chunksStored: z.number(),
        }),
      },
    },
    /** Import raw HTML for a specific article URL */
    importHtml: {
      method: 'POST' as const,
      path: '/api/crawler/import-html' as const,
      input: z.object({
        url: z.string().min(1),
        html: z.string().min(1),
      }),
      responses: {
        200: z.object({
          articleId: z.string(),
          title: z.string(),
          chunksStored: z.number(),
        }),
      },
    },
    /** Get crawl progress */
    progress: {
      method: 'GET' as const,
      path: '/api/crawler/progress' as const,
      responses: {
        200: z.object({
          status: z.string(),
          total: z.number(),
          crawled: z.number(),
          stored: z.number(),
          errors: z.array(z.string()),
          startedAt: z.string().nullable(),
          completedAt: z.string().nullable(),
        }),
      },
    },
    /** List all stored articles */
    articles: {
      method: 'GET' as const,
      path: '/api/crawler/articles' as const,
      responses: {
        200: z.array(z.object({
          articleId: z.string(),
          title: z.string(),
          url: z.string(),
          parentId: z.string().nullable(),
          chunkCount: z.number(),
        })),
      },
    },
    /** Get the article tree structure */
    tree: {
      method: 'GET' as const,
      path: '/api/crawler/tree' as const,
      responses: {
        200: z.record(z.object({
          title: z.string(),
          url: z.string(),
          parentId: z.string().nullable(),
          children: z.array(z.string()),
        })),
      },
    },
    /** Semantic search across Salesforce docs only */
    query: {
      method: 'POST' as const,
      path: '/api/crawler/query' as const,
      input: z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(20).optional(),
      }),
      responses: {
        200: z.array(z.object({
          id: z.number(),
          content: z.string(),
          metadata: z.record(z.unknown()),
          similarity: z.number(),
        })),
      },
    },
    /** Delete a specific article and all its chunks */
    deleteArticle: {
      method: 'DELETE' as const,
      path: '/api/crawler/articles/:articleId' as const,
      responses: {
        200: z.object({ deleted: z.number() }),
      },
    },
    /** Extract article content from a URL without storing it */
    extract: {
      method: 'POST' as const,
      path: '/api/crawler/extract' as const,
      input: z.object({
        url: z.string().url(),
      }),
      responses: {
        200: z.object({
          title: z.string(),
          url: z.string(),
          content: z.string(),
          sections: z.array(z.object({
            heading: z.string(),
            body: z.string(),
          })),
          wordCount: z.number(),
        }),
      },
    },
    /** Save previously extracted content to the database */
    saveExtracted: {
      method: 'POST' as const,
      path: '/api/crawler/save-extracted' as const,
      input: z.object({
        url: z.string(),
        title: z.string(),
        content: z.string(),
        sections: z.array(z.object({
          heading: z.string(),
          body: z.string(),
        })),
      }),
      responses: {
        200: z.object({
          articleId: z.string(),
          title: z.string(),
          chunksStored: z.number(),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
