import { z } from 'zod';

export const dataFieldSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['string', 'number', 'boolean', 'date', 'json']),
  required: z.boolean().default(true),
});

export const dataEntitySchema = z.object({
  name: z.string().min(1),
  fields: z.array(dataFieldSchema).min(1),
});

export const dataSchemaSchema = z.object({
  entities: z.array(dataEntitySchema).min(1),
  relations: z.array(z.record(z.string(), z.unknown())).default([]),
  indexes: z.array(z.record(z.string(), z.unknown())).default([]),
  crudRequirements: z.array(z.enum(['create', 'read', 'update', 'delete'])).default(['create', 'read', 'update', 'delete']),
});

export type DataSchemaContract = z.infer<typeof dataSchemaSchema>;
export type DataEntityContract = z.infer<typeof dataEntitySchema>;
