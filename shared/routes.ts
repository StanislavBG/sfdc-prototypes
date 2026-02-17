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
  helpDocs: {
    upload: {
      method: 'POST' as const,
      path: '/api/help-documents/upload' as const,
    },
    list: {
      method: 'GET' as const,
      path: '/api/help-documents' as const,
    },
    get: {
      method: 'GET' as const,
      path: '/api/help-documents/:id' as const,
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/help-documents/:id' as const,
    },
    search: {
      method: 'POST' as const,
      path: '/api/help-documents/search' as const,
      input: z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(20).optional(),
      }),
    },
    reprocess: {
      method: 'POST' as const,
      path: '/api/help-documents/:id/reprocess' as const,
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
