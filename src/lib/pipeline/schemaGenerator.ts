import { AppIntentContract } from '../schemas/appIntent.schema.js';
import { dataSchemaSchema, DataSchemaContract } from '../schemas/dataSchema.schema.js';

export function generateDataSchema(intent: AppIntentContract): DataSchemaContract {
  const entities = intent.entities.map((name) => ({
    name,
    fields: fieldsForEntity(name),
  }));

  return dataSchemaSchema.parse({
    entities,
    relations: inferRelations(intent.entities),
    indexes: intent.entities.map((entity) => ({ entity, fields: ['id'] })),
    crudRequirements: ['create', 'read', 'update', 'delete'],
  });
}

function fieldsForEntity(name: string) {
  const common = [{ name: 'id', type: 'string' as const, required: true }];
  const lower = name.toLowerCase();
  if (lower === 'product') {
    return [...common, { name: 'name', type: 'string' as const, required: true }, { name: 'price', type: 'number' as const, required: true }, { name: 'stock', type: 'number' as const, required: true }];
  }
  if (lower === 'customer' || lower === 'lead') {
    return [...common, { name: 'name', type: 'string' as const, required: true }, { name: 'email', type: 'string' as const, required: true }, { name: 'status', type: 'string' as const, required: true }];
  }
  if (lower === 'order') {
    return [...common, { name: 'customerId', type: 'string' as const, required: true }, { name: 'total', type: 'number' as const, required: true }, { name: 'status', type: 'string' as const, required: true }];
  }
  if (lower === 'payment') {
    return [...common, { name: 'orderId', type: 'string' as const, required: true }, { name: 'amount', type: 'number' as const, required: true }, { name: 'provider', type: 'string' as const, required: true }];
  }
  if (lower === 'activitylog' || lower === 'activity') {
    return [...common, { name: 'message', type: 'string' as const, required: true }, { name: 'severity', type: 'string' as const, required: true }, { name: 'createdAt', type: 'date' as const, required: true }];
  }
  return [...common, { name: 'name', type: 'string' as const, required: true }, { name: 'status', type: 'string' as const, required: true }, { name: 'createdAt', type: 'date' as const, required: true }];
}

function inferRelations(entities: string[]) {
  const has = (entity: string) => entities.includes(entity);
  const relations = [];
  if (has('Customer') && has('Order')) relations.push({ from: 'Order.customerId', to: 'Customer.id', type: 'many-to-one' });
  if (has('Order') && has('Payment')) relations.push({ from: 'Payment.orderId', to: 'Order.id', type: 'one-to-one' });
  if (has('Lead') && has('Activity')) relations.push({ from: 'Activity.leadId', to: 'Lead.id', type: 'many-to-one' });
  return relations;
}
