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
