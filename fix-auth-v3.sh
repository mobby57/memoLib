#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Correction automatique de l'authentification E2E (v3)${NC}"

# 1. Charger les variables d'environnement
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
    echo -e "${GREEN}✅ Variables d'environnement chargées depuis .env${NC}"
elif [ -f ".env.test" ]; then
    export $(grep -v '^#' .env.test | xargs)
    echo -e "${GREEN}✅ Variables d'environnement chargées depuis .env.test${NC}"
else
    echo -e "${RED}❌ Aucun fichier .env trouvé. Création d'un .env minimal...${NC}"
    echo "DATABASE_URL=\"postgresql://user:pass@localhost:5432/mydb?schema=public\"" > .env
    echo "NEXTAUTH_SECRET=\"test-secret-123\"" >> .env
    echo "NEXTAUTH_URL=\"http://localhost:3000\"" >> .env
    export $(grep -v '^#' .env | xargs)
fi

# 2. Vérifier que DATABASE_URL est défini
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL n'est pas défini. Vérifiez votre .env.${NC}"
    exit 1
fi

# 3. Appliquer le schéma Prisma (crée les tables si elles n'existent pas)
echo -e "${YELLOW}📦 Synchronisation du schéma Prisma...${NC}"
npx prisma db push --accept-data-loss

# 4. Exécuter le seed pour créer l'utilisateur avec un mot de passe fort
echo -e "${YELLOW}🌱 Exécution du seed...${NC}"
npx tsx prisma/seed-e2e.ts

# 5. Corriger le test : remplacer le beforeEach par une version robuste
TEST_FILE="tests/e2e/advanced-scenarios.spec.ts"
if [ -f "$TEST_FILE" ]; then
    echo -e "${YELLOW}📝 Correction du fichier de test (beforeEach) avec sed...${NC}"
    # Utiliser sed pour remplacer le bloc beforeEach par un nouveau
    # On crée un fichier temporaire avec le nouveau bloc
    cat > /tmp/new-beforeEach.txt << 'BE'
test.beforeEach(async ({ page }) => {
  await page.goto('/fr/auth/login');
  await page.fill('[name="email"]', 'avocat@test.com');
  await page.fill('[name="password"]', 'Test123!@#456');
  await Promise.all([
    page.waitForURL('/dashboard', { timeout: 10000 }),
    page.click('button[type="submit"]')
  ]);
  await expect(page).toHaveURL('/dashboard');
});
BE

    # On va remplacer tout le contenu du fichier en gardant le reste
    # Extraire la partie avant et après le beforeEach (si déjà présent)
    # Sinon, insérer après test.describe
    # Technique: on crée un nouveau fichier avec la bonne structure
    # On utilise une approche plus simple: on fait un backup et on réécrit le fichier
    # avec le nouveau bloc en remplacement du précédent.
    
    # On détecte si un beforeEach existe déjà
    if grep -q "test.beforeEach" "$TEST_FILE"; then
        # On supprime l'ancien bloc et on insère le nouveau à sa place
        # On utilise une approche avec sed pour supprimer entre "test.beforeEach" et la ligne avant le prochain test
        # Mais c'est compliqué avec sed. On utilise plutôt un script python.
        python3 << 'PY'
import re, sys
file = "tests/e2e/advanced-scenarios.spec.ts"
with open(file, 'r') as f:
    content = f.read()
# Remplacer le bloc beforeEach par le nouveau
new_before = '''test.beforeEach(async ({ page }) => {
  await page.goto('/fr/auth/login');
  await page.fill('[name="email"]', 'avocat@test.com');
  await page.fill('[name="password"]', 'Test123!@#456');
  await Promise.all([
    page.waitForURL('/dashboard', { timeout: 10000 }),
    page.click('button[type="submit"]')
  ]);
  await expect(page).toHaveURL('/dashboard');
});'''
# pattern pour trouver l'ancien beforeEach
pattern = r'test\.beforeEach\(async \(\{ page \}\) => \{[^}]*\}(?:\s*await page\.goto[^}]*)*\s*\};'
# On le remplace
new_content = re.sub(pattern, new_before, content, flags=re.DOTALL)
if new_content != content:
    with open(file, 'w') as f:
        f.write(new_content)
    print("✅ beforeEach corrigé avec succès.")
else:
    print("⚠️  Le beforeEach n'a pas été trouvé, insertion en haut.")
    # Insérer avant le premier test
    lines = content.split('\n')
    # Trouver la ligne avec test.describe
    for i,line in enumerate(lines):
        if 'test.describe' in line:
            # Trouver la fin du describe (la ligne avant le premier test)
            # On insère après la ligne "test.describe" et avant la première ligne non commentée
            # On va insérer après le bloc de description
            # On cherche le début du premier test
            for j in range(i+1, len(lines)):
                if 'test(' in lines[j]:
                    # insérer avant cette ligne
                    lines.insert(j, new_before)
                    break
            break
    with open(file, 'w') as f:
        f.write('\n'.join(lines))
    print("✅ beforeEach inséré.")
PY
    else
        echo -e "${RED}❌ Fichier test introuvable.${NC}"
        exit 1
    fi
fi

# 6. Lancer le test en mode debug
echo -e "${YELLOW}🧪 Lancement du test en mode debug...${NC}"
npx playwright test tests/e2e/advanced-scenarios.spec.ts:12 --debug
