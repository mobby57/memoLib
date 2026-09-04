import { writeFileSync, readFileSync } from 'fs';
import path from 'path';

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
const schemaContent = readFileSync(schemaPath, 'utf-8');

// Parser les modèles
const modelRegex = /model\s+(\w+)\s*{([^}]*)}/g;
const models: Record<string, any> = {};

let m;
while ((m = modelRegex.exec(schemaContent)) !== null) {
  const name = m[1];
  const body = m[2];
  const lines = body.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));
  const fields = [];
  for (const line of lines) {
    if (line.startsWith('@@')) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;
    const fieldName = parts[0];
    const fieldType = parts[1];
    const isRequired = !line.includes('?');
    const isList = line.includes('[]');
    const isRelation = line.includes('@relation');
    let defaultValue = null;
    const defaultMatch = line.match(/@default\(([^)]*)\)/);
    if (defaultMatch) {
      let val = defaultMatch[1].trim();
      // Si c'est une chaîne entre guillemets, on la garde avec les guillemets
      if (val.startsWith('"') && val.endsWith('"')) {
        // On la garde telle quelle, elle sera utilisée dans le code avec les guillemets doubles
        defaultValue = val;
      } else if (val.startsWith("'") && val.endsWith("'")) {
        defaultValue = val;
      } else if (val === 'true' || val === 'false') {
        defaultValue = val;
      } else if (val === 'now()') {
        defaultValue = 'new Date()';
      } else if (!isNaN(Number(val))) {
        defaultValue = val;
      } else {
        // Sinon, on entoure de guillemets simples
        defaultValue = `'${val}'`;
      }
    }
    fields.push({ name: fieldName, type: fieldType, isRequired, isList, isRelation, defaultValue });
  }
  models[name] = { fields };
}

console.log('📦 Modèles détectés :', Object.keys(models));

// Générer le seed
let seedCode = `
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
`;

// Ordre manuel pour les dépendances (on crée d'abord Plan, puis Tenant, User, etc.)
const order = ['Plan', 'Tenant', 'User', 'Client', 'Dossier', 'Subscription', 'Facture', 'Document', 'Email', 'Notification', 'AuditLog', 'CalendarEvent', 'TimeEntry', 'Draft', 'Jurisprudence', 'LegalReference', 'LegalDeadline', 'ArchivePolicy', 'Proof', 'Report', 'UsageRecord', 'QuotaEvent', 'StripeWebhookEvent', 'TemplateVote', 'CommunityTemplate', 'VerificationToken', 'AIDecision', 'CompteComptable', 'Journal', 'Ecriture', 'LigneEcriture', 'MouvementBancaire', 'DeclarationTVA', 'MouvementCARPA', 'DossierChecklistItem', 'InformationUnit', 'InformationStatusHistory', 'EmailAttachment', 'LigneFacture', 'Paiement', 'DeadlineAlert', 'TenantSettings', 'AIUsageLog', 'WorkflowExecution', 'EmailAccount'];

const allModelNames = Object.keys(models);
// On crée d'abord ceux dans l'ordre, puis le reste
const created = new Set();
for (const name of order) {
  if (models[name] && !created.has(name)) {
    created.add(name);
    generateModel(name, models[name]);
  }
}
for (const name of allModelNames) {
  if (!created.has(name)) {
    created.add(name);
    generateModel(name, models[name]);
  }
}

function generateModel(modelName: string, model: any) {
  const fields = model.fields;
  const scalarFields = fields.filter(f => !f.isRelation && !f.isList);
  const idField = scalarFields.find(f => f.name === 'id');
  const idValue = idField ? `'${modelName.toLowerCase()}-1'` : 'undefined';

  const createFields: string[] = [];
  for (const field of scalarFields) {
    if (field.name === 'id') {
      createFields.push(`      id: ${idValue},`);
      continue;
    }
    if (field.isRequired) {
      let value: string;
      if (field.defaultValue !== null) {
        // Utiliser la valeur par défaut extraite
        value = field.defaultValue;
        // Si c'est une chaîne, on ajoute les guillemets simples si pas déjà
        if (typeof value === 'string' && !value.startsWith('"') && !value.startsWith("'") && !value.startsWith('new Date') && !value.startsWith('[') && !value.startsWith('{') && value !== 'true' && value !== 'false' && !value.startsWith('[') && !value.startsWith('{')) {
          value = `'${value}'`;
        }
      } else {
        const type = field.type;
        if (type === 'String') value = `'default-${field.name}'`;
        else if (type === 'Int' || type === 'Float') value = '0';
        else if (type === 'Boolean') value = 'false';
        else if (type === 'DateTime') value = 'new Date()';
        else value = 'null';
      }
      createFields.push(`      ${field.name}: ${value},`);
    }
  }

  // Ajouter createdAt/updatedAt si manquants
  if (!scalarFields.some(f => f.name === 'createdAt')) createFields.push(`      createdAt: new Date(),`);
  if (!scalarFields.some(f => f.name === 'updatedAt')) createFields.push(`      updatedAt: new Date(),`);

  // Relations (simplifiées : on suppose que les clés étrangères existent déjà)
  const relationFields = fields.filter(f => f.isRelation && !f.isList);
  for (const rel of relationFields) {
    const relatedModel = rel.type;
    if (models[relatedModel]) {
      const fkName = rel.name;
      // On ajoute la clé étrangère si elle n'est pas déjà dans scalarFields
      if (!scalarFields.some(f => f.name === fkName)) {
        createFields.push(`      ${fkName}: '${relatedModel.toLowerCase()}-1',`);
      }
    }
  }

  const createBlock = createFields.join('\n');
  seedCode += `
  // ${modelName}
  await prisma.${modelName.toLowerCase()}.upsert({
    where: { id: ${idValue} },
    update: {},
    create: {
${createBlock}
    },
  });
`;
}

seedCode += `
  console.log('✅ Seed généré automatiquement terminé.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

writeFileSync('prisma/seed-auto-v2.ts', seedCode);
console.log('✅ Seed généré dans prisma/seed-auto-v2.ts');
