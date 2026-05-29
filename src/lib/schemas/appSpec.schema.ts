import { z } from 'zod';

export const appPageSchema = z.object({
  name: z.string().min(1),
  route: z.string().min(1).startsWith('/'),
  components: z.array(z.string().min(1)).default([]),
});

export const apiRouteSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  path: z.string().min(1).startsWith('/api/'),
  entity: z.string().min(1),
});

export const appSpecSchema = z.object({
  pages: z.array(appPageSchema).min(1),
  apiRoutes: z.array(apiRouteSchema).min(1),
  databaseTables: z.array(z.string().min(1)).default([]),
  authFlow: z.object({
    enabled: z.boolean(),
    type: z.string().min(1),
  }),
  navigationFlow: z.array(z.record(z.string(), z.unknown())).default([]),
  integrationHooks: z.array(z.record(z.string(), z.unknown())).default([]),
});

export type AppSpecContract = z.infer<typeof appSpecSchema>;
export type ApiRouteContract = z.infer<typeof apiRouteSchema>;
