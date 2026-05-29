import { AppIntentContract } from '../schemas/appIntent.schema.js';
import { DataSchemaContract } from '../schemas/dataSchema.schema.js';
import { appSpecSchema, AppSpecContract } from '../schemas/appSpec.schema.js';

export function generateAppSpec(intent: AppIntentContract, dataSchema: DataSchemaContract): AppSpecContract {
  const entityPages = dataSchema.entities.slice(0, 4).map((entity) => ({
    name: pluralize(entity.name),
    route: `/${slugify(pluralize(entity.name))}`,
    components: ['DataTable', 'Button', 'Card'],
  }));

  const apiRoutes = dataSchema.entities.flatMap((entity) => {
    const path = `/api/${slugify(pluralize(entity.name))}`;
    return [
      { method: 'GET' as const, path, entity: entity.name },
      { method: 'POST' as const, path, entity: entity.name },
    ];
  });

  return appSpecSchema.parse({
    pages: [
      { name: 'Dashboard', route: '/dashboard', components: ['StatsCard', 'RecentOrders', 'InventoryAlert'] },
      ...entityPages,
      { name: 'Settings', route: '/settings', components: ['SettingsPanel', 'IntegrationStatus'] },
    ],
    apiRoutes,
    databaseTables: dataSchema.entities.map((entity) => slugify(pluralize(entity.name))),
    authFlow: {
      enabled: intent.authRequired,
      type: intent.authRequired ? 'email-password' : 'none',
    },
    navigationFlow: [
      { from: '/', to: '/dashboard', label: 'Start workspace' },
      ...entityPages.map((page) => ({ from: '/dashboard', to: page.route, label: page.name })),
    ],
    integrationHooks: intent.integrations.map((integration) => ({
      integration,
      trigger: integration === 'Stripe' ? 'payment.succeeded' : 'record.created',
      action: `Dispatch ${integration} workflow`,
    })),
  });
}

function slugify(value: string) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function pluralize(value: string) {
  if (value.endsWith('y')) return `${value.slice(0, -1)}ies`;
  if (value.endsWith('s')) return value;
  return `${value}s`;
}
