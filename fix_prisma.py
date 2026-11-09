import re

prisma_path = "prisma/schema.prisma"
with open(prisma_path, "r", encoding="utf-8") as f:
    schema = f.read()

# 1. Ajouter 'cases Case[]' dans le modèle Client
if "model Client" in schema and "cases Case[]" not in schema:
    schema = re.sub(r'(model Client \{.*?)(\})', r'\1  cases             Case[]\n\2', schema, flags=re.DOTALL)
    print("✅ Champ 'cases' ajouté au modèle Client.")

# 2. Ajouter la relation inverse dans le modèle Document
if "model Document" in schema and "caseId" not in schema:
    # On ajoute caseId et la relation case
    schema = re.sub(r'(model Document \{.*?)(\})', r'\1  caseId            String?\n  case              Case?    @relation(fields: [caseId], references: [id])\n\2', schema, flags=re.DOTALL)
    print("✅ Relation 'case' ajoutée au modèle Document.")

with open(prisma_path, "w", encoding="utf-8") as f:
    f.write(schema)
    
print("🎉 Schéma Prisma corrigé !")
