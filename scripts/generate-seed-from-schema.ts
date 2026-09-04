import { writeFileSync } from 'fs';
import { readFileSync } from 'fs';
import path from 'path';

// 1. Lire le fichier schema.prisma
const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
const schemaContent = readFileSync(schemaPath, 'utf-8');

// 2. Parser les modèles
const modelRegex = /model\s+(\w+)\s*{([^}]*)}/g;
const models: Record<string, { fields: { name: string; type: string; isRequired: boolean; isList: boolean; isRelation: boolean; defaultValue?: any }[] }> = {};

let match;
while ((match = modelRegex.exec(schemaContent)) !== null) {
  const name = match[1];
  const body = match[2];
  const lines = body.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));
  const fields = [];
  for (const line of lines) {
    // Ignorer les lignes avec @@index, @@map, etc.
    if (line.startsWith('@@')) continue;
    // Extraire le champ: nom type [attributes]
    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;
    const fieldName = parts[0];
    const fieldType = parts[1];
    const isRequired = !line.includes('?');
    const isList = line.includes('[]');
    const isRelation = line.includes('@relation');
    // Vérifier si une valeur par défaut est définie
    let defaultValue = null;
    const defaultMatch = line.match(/@default\(([^)]*)\)/);
    if (defaultMatch) {
      defaultValue = defaultMatch[1];
    }
    fields.push({ name: fieldName, type: fieldType, isRequired, isList, isRelation, defaultValue });
  }
  models[name] = { fields };
}

console.log('📦 Modèles détectés :', Object.keys(models));

// 3. Générer le seed
let seedCode = `
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
`;

// Définir les dépendances (ordre de création)
// On va créer d'abord les modèles sans relations, puis ceux avec.
// Pour simplifier, on va les créer dans l'ordre où ils apparaissent dans le fichier, mais en s'assurant que les relations existent.
// On va créer des IDs fixes pour chaque modèle.
const ids: Record<string, string> = {};
for (const modelName of Object.keys(models)) {
  ids[modelName] = `'${modelName.toLowerCase()}-1'`;
}

// Pour chaque modèle, générer un upsert
for (const modelName of Object.keys(models)) {
  const model = models[modelName];
  const fields = model.fields;
  const scalarFields = fields.filter(f => !f.isRelation && !f.isList);
  const idField = scalarFields.find(f => f.name === 'id');

  // Si le modèle a un champ id obligatoire
  let idValue = idField ? `'${modelName.toLowerCase()}-1'` : 'undefined';

  // Construction des champs pour le create
  const createFields: string[] = [];
  for (const field of scalarFields) {
    if (field.name === 'id') {
      createFields.push(`      id: ${idValue},`);
      continue;
    }
    // Si le champ est obligatoire, on le met
    if (field.isRequired) {
      let value: string;
      const type = field.type;
      if (type === 'String') {
        if (field.defaultValue !== null) {
          // Si la valeur par défaut contient des guillemets, on l'utilise directement
          value = field.defaultValue;
        } else {
          value = `'default-${field.name}'`;
        }
      } else if (type === 'Int' || type === 'Float') {
        value = field.defaultValue !== null ? field.defaultValue : '0';
      } else if (type === 'Boolean') {
        value = field.defaultValue !== null ? field.defaultValue : 'false';
      } else if (type === 'DateTime') {
        value = 'new Date()';
      } else if (type === 'Json') {
        value = '{}';
      } else {
        value = 'null';
      }
      // Si la valeur par défaut est un string avec des guillemets déjà, on l'utilise directement
      if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
        // on laisse tel quel
      } else if (typeof value === 'string' && !value.startsWith('"') && !value.startsWith('[') && !value.startsWith('{')) {
        // On entoure les strings simples
        if (value !== 'null' && value !== 'true' && value !== 'false' && !value.includes('new Date') && !value.includes('[') && !value.includes('{') && !value.includes('"')) {
          value = `'${value}'`;
        }
      }
      createFields.push(`      ${field.name}: ${value},`);
    }
  }

  // Ajouter les relations (clés étrangères)
  // On va créer des relations en supposant que les modèles liés existent déjà
  // Pour simplifier, on ajoute les relations avec des IDs fixes (on suppose que les modèles créés avant ont des IDs connus)
  // On va les ajouter après les champs scalaires
  const relationFields = fields.filter(f => f.isRelation);
  for (const rel of relationFields) {
    if (!rel.isList) {
      // c'est une relation many-to-one ou one-to-one
      const relatedModel = rel.type;
      const fkName = rel.name;
      // On ajoute le champ FK si le modèle lié a déjà été créé (on utilise son ID fixe)
      if (models[relatedModel]) {
        createFields.push(`      ${fkName}: '${relatedModel.toLowerCase()}-1',`);
      }
    }
  }

  // Ajouter createdAt et updatedAt si manquants (DateTime)
  if (!scalarFields.some(f => f.name === 'createdAt')) {
    createFields.push(`      createdAt: new Date(),`);
  }
  if (!scalarFields.some(f => f.name === 'updatedAt')) {
    createFields.push(`      updatedAt: new Date(),`);
  }

  const createBlock = createFields.join('\n');

  seedCode += `
  // Création de ${modelName}
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

// Écrire le fichier seed-auto.ts
const outputPath = path.join(process.cwd(), 'prisma', 'seed-auto.ts');
writeFileSync(outputPath, seedCode);
console.log(`✅ Seed généré dans ${outputPath}`);
