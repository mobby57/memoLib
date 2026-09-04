import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // @ts-ignore
  const dmmf = prisma._dmmf;
  const models = dmmf.datamodel.models;

  for (const model of models) {
    console.log(`\n📦 Modèle: ${model.name}`);
    const required = model.fields.filter(f => f.isRequired && f.kind === 'scalar');
    if (required.length === 0) {
      console.log('  Aucun champ scalaire obligatoire');
    } else {
      console.log('  Champs obligatoires:');
      for (const field of required) {
        console.log(`    - ${field.name}: ${field.type}`);
      }
    }
  }
}

main();
