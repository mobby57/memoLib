import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const prisma = new PrismaClient();

async function generateSeed() {
  // Récupère le DMMF (Data Model Meta Format)
  const dmmf = (prisma as any)._dmmf;
  const models = dmmf.datamodel.models;

  let seedContent = `
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
`;

  // Détermine l'ordre de création (dépendances)
  const modelNames = models.map(m => m.name);
  const order: string[] = [];

  // Simple ordre topologique: d'abord ceux sans relations, puis ceux qui en dépendent
  // On va créer dans l'ordre de déclaration dans le schéma, mais on peut ajuster
  // On va inverser l'ordre pour que les relations soient créées après.
  // Pour simplifier, on va créer les modèles dans l'ordre où ils apparaissent, en s'assurant que les relations sont faites après.

  // On va créer tous les modèles, mais pour les relations on utilisera des placeholders.
  // Comme on utilise upsert, on peut les créer dans n'importe quel ordre.
  // Mais il faut que les clés étrangères existent.
  // On va d'abord créer les modèles sans relations, puis ceux avec.
  // On va les trier manuellement: Plan, Tenant, User, Client, Dossier, etc.
  // Mais pour simplifier, on va les créer tous avec upsert, et on suppose que les relations sont déjà créées.

  for (const model of models) {
    const modelName = model.name;
    // Ignorer les modèles de relations implicites (si présents)
    if (modelName.includes('_')) continue;
    seedContent += `
  // Création de ${modelName}
  const ${modelName.toLowerCase()} = await prisma.${modelName.toLowerCase()}.upsert({
    where: { id: 'default-${modelName.toLowerCase()}' },
    update: {},
    create: {
      id: 'default-${modelName.toLowerCase()}',\n`;

    // Ajouter tous les champs scalaires (sauf id déjà ajouté)
    for (const field of model.fields) {
      if (field.kind === 'scalar' && field.name !== 'id') {
        // Déterminer une valeur par défaut selon le type
        let defaultValue: string;
        const type = field.type;
        if (type === 'String') {
          if (field.isList) continue;
          defaultValue = `'default-${field.name}'`;
        } else if (type === 'Int' || type === 'Float') {
          defaultValue = '0';
        } else if (type === 'Boolean') {
          defaultValue = field.default !== undefined ? JSON.stringify(field.default) : 'false';
        } else if (type === 'DateTime') {
          defaultValue = 'new Date()';
        } else if (type === 'Json') {
          defaultValue = '{}';
        } else {
          defaultValue = 'null';
        }
        // Si le champ a une valeur par défaut dans le schéma, on l'utilise
        if (field.default !== undefined && field.default !== null) {
          if (typeof field.default === 'string' && field.default.startsWith('now()')) {
            defaultValue = 'new Date()';
          } else if (typeof field.default === 'string') {
            defaultValue = `'${field.default}'`;
          } else if (typeof field.default === 'boolean') {
            defaultValue = JSON.stringify(field.default);
          } else if (typeof field.default === 'number') {
            defaultValue = String(field.default);
          }
        }
        // Si le champ est requis (isRequired), on l'ajoute
        if (field.isRequired) {
          seedContent += `      ${field.name}: ${defaultValue},\n`;
        }
      }
    }
    seedContent += `    },\n  });\n`;
  }

  seedContent += `
  console.log('✅ Seed généré automatiquement.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

  // Écrire le fichier seed
  writeFileSync('prisma/seed-auto.ts', seedContent);
  console.log('✅ Seed généré dans prisma/seed-auto.ts');
}

generateSeed();
