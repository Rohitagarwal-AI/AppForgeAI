/**
 * @module lib/pipeline/stages/schema-generation
 * @description Stage 2 — Schema Generation.
 * Takes a structured {@link AppIntent} and produces a {@link DataSchema}
 * containing entity definitions, field schemas, and relations.
 * Leverages entity templates from the catalog as reference for the AI.
 */

import type { AppIntent } from '@/types/intent';
import type { DataSchema } from '@/types/schema';
import type { AICompletionRequest, AICompletionResponse } from '@/lib/gateway/types';
import { getEntityTemplate } from '@/lib/catalog/entity-templates';
import { getAppTypeDefinition } from '@/lib/catalog/app-types';

/**
 * Collects relevant entity template hints for the AI based on the intent.
 *
 * @param intent - The extracted app intent.
 * @returns A formatted string of entity template samples.
 */
function collectTemplateHints(intent: AppIntent): string {
  const relevantEntityNames = new Set<string>();

  // Add entities from the intent
  for (const entity of intent.entities) {
    const normalized = entity.toLowerCase().replace(/\s+/g, '_');
    relevantEntityNames.add(normalized);
    // Also try plural form
    relevantEntityNames.add(normalized.endsWith('s') ? normalized : `${normalized}s`);
  }

  // Add default entities from the app type definition
  const appTypeDef = getAppTypeDefinition(intent.appType);
  if (appTypeDef) {
    for (const entityName of appTypeDef.defaultEntities) {
      relevantEntityNames.add(entityName);
    }
  }

  const hints: string[] = [];
  for (const name of relevantEntityNames) {
    const template = getEntityTemplate(name);
    if (template) {
      const fieldSummary = template.fields
        .map((f) => {
          let desc = `    - ${f.name}: ${f.type}`;
          if (f.nullable) desc += ', nullable';
          if (f.isPrimary) desc += ', PRIMARY KEY';
          if (f.isUnique) desc += ', UNIQUE';
          if (f.isRelation && f.references) desc += `, FK → ${f.references.entity}.${f.references.field}`;
          if (f.enumValues && f.enumValues.length > 0) desc += `, enum[${f.enumValues.join('|')}]`;
          if (f.defaultValue !== undefined) desc += `, default=${String(f.defaultValue)}`;
          return desc;
        })
        .join('\n');

      const relationSummary = template.defaultRelations
        .map((r) => `    - ${r.type} → ${r.targetEntity} (via ${r.foreignKey})`)
        .join('\n');

      hints.push(
        `  Entity: ${template.name} (table: ${template.tableName})\n  Fields:\n${fieldSummary}${relationSummary ? `\n  Relations:\n${relationSummary}` : ''}`
      );
    }
  }

  if (hints.length === 0) {
    return 'No matching entity templates found. Generate schemas from scratch based on the intent.';
  }

  return hints.join('\n\n');
}

/**
 * Build the system prompt that instructs the AI how to generate data schemas.
 *
 * @returns The full system-prompt string.
 */
function buildSystemPrompt(): string {
  const validFieldTypes = [
    'string', 'number', 'integer', 'float', 'decimal', 'boolean', 'date',
    'datetime', 'json', 'uuid', 'text', 'email', 'url', 'phone', 'enum',
  ].join(', ');

  return `You are an expert database architect. Your task is to generate a complete data schema for an application based on the provided intent and entity template hints.

## Rules

1. **Entity naming** — Entity names must be PascalCase singular (e.g. "User", "OrderItem"). Table names must be snake_case plural (e.g. "users", "order_items").

2. **Mandatory tenant isolation** — Every entity MUST have \`tenantId: true\` and a \`tenant_id\` uuid field. This is a hard requirement for multi-tenant isolation.

3. **Base fields** — Every entity MUST include these base fields:
   - id: uuid, isPrimary=true, isUnique=true, nullable=false, defaultValue="gen_random_uuid()"
   - tenant_id: uuid, isRelation=false, nullable=false
   - created_at: datetime, nullable=false, defaultValue="now()"
   - updated_at: datetime, nullable=false, defaultValue="now()"

4. **Field types** — Each field type must be one of: ${validFieldTypes}.

5. **Relations** — Must be bidirectional. If entity A has a "belongsTo" relation to entity B, then entity B must have a corresponding "hasMany" or "hasOne" relation back to A. Valid relation types: "hasMany", "belongsTo", "hasOne".

6. **Foreign keys** — For every \`belongsTo\` relation, add a corresponding field with \`isRelation: true\` and a \`references\` object pointing to the target entity's primary key field.

7. **Enum fields** — When using type "enum", always provide \`enumValues\` as an array of allowed string values. Enum values should be snake_case.

8. **Uniqueness** — Apply isUnique=true only where semantically meaningful (e.g. email, slugs, order numbers).

9. **Defaults** — Provide sensible defaults where applicable (e.g. status fields, boolean flags, timestamps).

10. **Use template hints** — If entity templates are provided below, use them as a starting reference but adapt fields as needed for the specific application requirements.

11. **version** — Set the schema version to "1.0.0".

## Output Format

Return ONLY valid JSON matching this exact shape (no markdown fences, no commentary):

{
  "entities": [
    {
      "name": "EntityName",
      "tableName": "entity_names",
      "fields": [
        {
          "name": "fieldName",
          "type": "string",
          "nullable": false,
          "isRelation": false,
          "isPrimary": false,
          "isUnique": false,
          "defaultValue": null,
          "enumValues": [],
          "references": null
        }
      ],
      "relations": [
        {
          "type": "hasMany",
          "targetEntity": "OtherEntity",
          "foreignKey": "entity_name_id"
        }
      ],
      "tenantId": true
    }
  ],
  "version": "1.0.0"
}`;
}

/**
 * Generates a {@link DataSchema} from a structured {@link AppIntent}.
 *
 * @param intent - The extracted application intent from Stage 1.
 * @param completeAI - Gateway function to call the AI provider.
 * @returns A fully populated {@link DataSchema}.
 * @throws {Error} If the AI response cannot be parsed or does not conform.
 */
export async function generateSchema(
  intent: AppIntent,
  completeAI: (request: AICompletionRequest) => Promise<AICompletionResponse>
): Promise<DataSchema> {
  const systemPrompt = buildSystemPrompt();
  const templateHints = collectTemplateHints(intent);

  const userPrompt = `Generate a complete data schema for the following application:

## Application Intent
- App Name: ${intent.appName}
- App Type: ${intent.appType}
- Features: ${intent.features.join(', ') || 'none specified'}
- Entities Requested: ${intent.entities.join(', ') || 'none specified'}
- Integrations: ${intent.integrationsRequested.join(', ') || 'none'}
- Assumptions: ${intent.assumptions.join('; ') || 'none'}

## Entity Template Hints (use as reference)
${templateHints}

Generate entity schemas for ALL entities needed by this application. Include the entities listed above plus any additional entities that are necessary for the features and integrations described. Ensure all relations are bidirectional.`;

  const request: AICompletionRequest = {
    systemPrompt,
    userPrompt,
    temperature: 0.2,
    maxTokens: 4096,
    responseFormat: 'json',
  };

  const response = await completeAI(request);
  const rawContent = response.content.trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    throw new Error(
      `Schema generation failed: AI response is not valid JSON. Raw content: ${rawContent.slice(0, 500)}`
    );
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Schema generation failed: AI response is not a JSON object.');
  }

  const obj = parsed as Record<string, unknown>;

  if (!Array.isArray(obj['entities'])) {
    throw new Error('Schema generation failed: "entities" field is missing or not an array.');
  }

  const dataSchema: DataSchema = {
    entities: (obj['entities'] as Record<string, unknown>[]).map(parseEntitySchema),
    version: typeof obj['version'] === 'string' ? obj['version'] : '1.0.0',
  };

  return dataSchema;
}

/**
 * Parses a raw entity object from the AI response into a typed EntitySchema.
 */
function parseEntitySchema(raw: Record<string, unknown>): DataSchema['entities'][number] {
  return {
    name: typeof raw['name'] === 'string' ? raw['name'] : 'UnknownEntity',
    tableName: typeof raw['tableName'] === 'string' ? raw['tableName'] : 'unknown_entities',
    fields: Array.isArray(raw['fields'])
      ? (raw['fields'] as Record<string, unknown>[]).map(parseFieldSchema)
      : [],
    relations: Array.isArray(raw['relations'])
      ? (raw['relations'] as Record<string, unknown>[]).map(parseRelation)
      : [],
    tenantId: true,
  };
}

/**
 * Parses a raw field object into a typed FieldSchema.
 */
function parseFieldSchema(raw: Record<string, unknown>): DataSchema['entities'][number]['fields'][number] {
  const validFieldTypes = new Set([
    'string', 'number', 'integer', 'float', 'decimal', 'boolean', 'date',
    'datetime', 'json', 'uuid', 'text', 'email', 'url', 'phone', 'enum',
  ]);

  const rawType = typeof raw['type'] === 'string' ? raw['type'] : 'string';
  const fieldType = validFieldTypes.has(rawType)
    ? (rawType as DataSchema['entities'][number]['fields'][number]['type'])
    : 'string';

  const result: DataSchema['entities'][number]['fields'][number] = {
    name: typeof raw['name'] === 'string' ? raw['name'] : 'unknown_field',
    type: fieldType,
    nullable: typeof raw['nullable'] === 'boolean' ? raw['nullable'] : false,
    isRelation: typeof raw['isRelation'] === 'boolean' ? raw['isRelation'] : false,
    isPrimary: typeof raw['isPrimary'] === 'boolean' ? raw['isPrimary'] : false,
    isUnique: typeof raw['isUnique'] === 'boolean' ? raw['isUnique'] : false,
  };

  if (raw['defaultValue'] !== undefined && raw['defaultValue'] !== null) {
    result.defaultValue = raw['defaultValue'] as string | number | boolean;
  }

  if (Array.isArray(raw['enumValues']) && raw['enumValues'].length > 0) {
    result.enumValues = (raw['enumValues'] as unknown[]).filter(
      (v): v is string => typeof v === 'string'
    );
  }

  if (
    typeof raw['references'] === 'object' &&
    raw['references'] !== null &&
    !Array.isArray(raw['references'])
  ) {
    const ref = raw['references'] as Record<string, unknown>;
    if (typeof ref['entity'] === 'string' && typeof ref['field'] === 'string') {
      result.references = { entity: ref['entity'], field: ref['field'] };
    }
  }

  return result;
}

/**
 * Parses a raw relation object into a typed Relation.
 */
function parseRelation(raw: Record<string, unknown>): DataSchema['entities'][number]['relations'][number] {
  const validRelationTypes = new Set(['hasMany', 'belongsTo', 'hasOne']);
  const rawType = typeof raw['type'] === 'string' ? raw['type'] : 'hasMany';
  const relationType = validRelationTypes.has(rawType)
    ? (rawType as DataSchema['entities'][number]['relations'][number]['type'])
    : 'hasMany';

  return {
    type: relationType,
    targetEntity: typeof raw['targetEntity'] === 'string' ? raw['targetEntity'] : 'Unknown',
    foreignKey: typeof raw['foreignKey'] === 'string' ? raw['foreignKey'] : 'unknown_id',
  };
}
