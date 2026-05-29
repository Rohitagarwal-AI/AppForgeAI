import { AppIntentContract, appIntentSchema } from '../schemas/appIntent.schema.js';
import { AppSpecContract, appSpecSchema } from '../schemas/appSpec.schema.js';
import { DataSchemaContract, dataSchemaSchema } from '../schemas/dataSchema.schema.js';

export interface RepairResult {
  appIntent: AppIntentContract;
  dataSchema: DataSchemaContract;
  appSpec: AppSpecContract;
  repairLog: string[];
}

export function repairPipelineOutput(
  appIntent: Partial<AppIntentContract>,
  dataSchema: Partial<DataSchemaContract>,
  appSpec: Partial<AppSpecContract>,
): RepairResult {
  const repairLog: string[] = [];
  const safeIntent = { ...appIntent };

  if (!safeIntent.appName) {
    safeIntent.appName = 'AppForge Project';
    repairLog.push('Missing app name detected -> inferred from prompt');
  }
  if (!safeIntent.features?.length) {
    safeIntent.features = ['dashboard', 'records'];
    repairLog.push('Missing feature list detected -> added dashboard and records defaults');
  }
  if (!safeIntent.entities?.length) {
    safeIntent.entities = ['Product', 'Customer', 'Order'];
    repairLog.push('Missing entities detected -> inferred Product, Customer, and Order');
  }
  if ((safeIntent.features || []).some((feature) => /payment/i.test(feature)) && !(safeIntent.integrations || []).length) {
    safeIntent.integrations = ['Stripe'];
    repairLog.push('Payment provider missing -> marked Stripe as optional integration');
  }

  const parsedIntent = appIntentSchema.parse({
    targetUsers: ['workspace owner', 'staff'],
    authRequired: false,
    integrations: [],
    assumptions: [],
    missingInfo: [],
    warnings: [],
    ...safeIntent,
  });

  const safeSchema = {
    entities: (dataSchema.entities?.length ? dataSchema.entities : parsedIntent.entities.map((name) => ({ name, fields: [] }))).map((entity) => {
      const fields = [...(entity.fields || [])];
      if (!fields.some((field) => field.name === 'id')) {
        fields.unshift({ name: 'id', type: 'string' as const, required: true });
        repairLog.push(`${entity.name} entity missing id field -> added default id field`);
      }
      if (entity.name === 'Product' && !fields.some((field) => field.name === 'stock')) {
        fields.push({ name: 'stock', type: 'number' as const, required: true });
        repairLog.push('Product entity missing stock field -> added default field');
      }
      if (fields.length === 1) {
        fields.push({ name: 'name', type: 'string' as const, required: true });
        repairLog.push(`${entity.name} entity had no business fields -> added name field`);
      }
      return { name: entity.name, fields };
    }),
    relations: dataSchema.relations || [],
    indexes: dataSchema.indexes || [],
    crudRequirements: dataSchema.crudRequirements || ['create', 'read', 'update', 'delete'],
  };
  const parsedSchema = dataSchemaSchema.parse(safeSchema);

  const entitySet = new Set(parsedSchema.entities.map((entity) => entity.name));
  const safePages = appSpec.pages?.length ? [...appSpec.pages] : [{ name: 'Dashboard', route: '/dashboard', components: ['StatsCard'] }];
  if (!safePages.some((page) => page.name === 'Customers') && entitySet.has('Customer')) {
    safePages.push({ name: 'Customers', route: '/customers', components: ['DataTable', 'Card'] });
    repairLog.push('Customers page missing route -> generated /customers route');
  }
  if (!safePages.some((page) => page.route === '/settings')) {
    safePages.push({ name: 'Settings', route: '/settings', components: ['SettingsPanel'] });
    repairLog.push('Settings page missing route -> generated /settings route');
  }

  const apiRoutes = (appSpec.apiRoutes?.length ? appSpec.apiRoutes : parsedSchema.entities.map((entity) => ({
    method: 'GET' as const,
    path: `/api/${entity.name.toLowerCase()}s`,
    entity: entity.name,
  }))).filter((route) => entitySet.has(route.entity));

  const parsedSpec = appSpecSchema.parse({
    pages: safePages,
    apiRoutes,
    databaseTables: appSpec.databaseTables?.length ? appSpec.databaseTables : parsedSchema.entities.map((entity) => `${entity.name.toLowerCase()}s`),
    authFlow: appSpec.authFlow || { enabled: parsedIntent.authRequired, type: parsedIntent.authRequired ? 'email-password' : 'none' },
    navigationFlow: appSpec.navigationFlow || [],
    integrationHooks: appSpec.integrationHooks || [],
  });

  return {
    appIntent: parsedIntent,
    dataSchema: parsedSchema,
    appSpec: parsedSpec,
    repairLog,
  };
}
