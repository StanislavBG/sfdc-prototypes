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
    diagnose: {
      method: 'POST' as const,
      path: '/api/help-documents/diagnose' as const,
    },
    republish: {
      method: 'POST' as const,
      path: '/api/help-documents/:id/republish' as const,
    },
    reprocess: {
      method: 'POST' as const,
      path: '/api/help-documents/:id/reprocess' as const,
    },
  },
  identityRulesets: {
    list: {
      method: 'GET' as const,
      path: '/api/identity-rulesets' as const,
    },
    get: {
      method: 'GET' as const,
      path: '/api/identity-rulesets/:id' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/identity-rulesets' as const,
    },
    update: {
      method: 'PUT' as const,
      path: '/api/identity-rulesets/:id' as const,
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/identity-rulesets/:id' as const,
    },
  },
  bsCharts: {
    list: {
      method: 'GET' as const,
      path: '/api/bs-charts' as const,
    },
    get: {
      method: 'GET' as const,
      path: '/api/bs-charts/:id' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/bs-charts' as const,
    },
    update: {
      method: 'PUT' as const,
      path: '/api/bs-charts/:id' as const,
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/bs-charts/:id' as const,
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
