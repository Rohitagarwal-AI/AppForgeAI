import { z } from 'zod';

export const appIntentSchema = z.object({
  appName: z.string().min(1),
  appType: z.string().min(1),
  targetUsers: z.array(z.string().min(1)).default([]),
  features: z.array(z.string().min(1)).default([]),
  entities: z.array(z.string().min(1)).default([]),
  authRequired: z.boolean().default(false),
  integrations: z.array(z.string().min(1)).default([]),
  assumptions: z.array(z.string().min(1)).default([]),
  missingInfo: z.array(z.string().min(1)).default([]),
  warnings: z.array(z.string().min(1)).default([]),
});

export type AppIntentContract = z.infer<typeof appIntentSchema>;
