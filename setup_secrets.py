import os

# 1. Mise à jour du .gitignore
gitignore_content = """
# Environnement (Ne jamais commiter)
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
"""
gitignore_path = ".gitignore"
if os.path.exists(gitignore_path):
    with open(gitignore_path, "r", encoding="utf-8") as f:
        content = f.read()
    if ".env.local" not in content:
        with open(gitignore_path, "a", encoding="utf-8") as f:
            f.write("\n" + gitignore_content)
        print("✅ Règles de .gitignore ajoutées.")
else:
    with open(gitignore_path, "w", encoding="utf-8") as f:
        f.write(gitignore_content)
    print("✅ Fichier .gitignore créé.")

# 2. Création du .env.example
env_example = """# === BASE DE DONNÉES ===
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"

# === AUTHENTIFICATION (CLERK) ===
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# === PAIEMENTS (STRIPE) ===
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# === API PISTE (LÉGIFRANCE / JUDILIBRE) ===
PISTE_CLIENT_ID="..."
PISTE_CLIENT_SECRET="..."
JUDILIBRE_KEY_ID="..."
"""
with open(".env.example", "w", encoding="utf-8") as f:
    f.write(env_example)
print("✅ Fichier .env.example créé.")

# 3. Ajouter 'server-only' aux fichiers sensibles
fichiers_sensibles = ["src/lib/piste-api.ts", "src/lib/ceseda-delais.ts"]
for fichier in fichiers_sensibles:
    if os.path.exists(fichier):
        with open(fichier, "r", encoding="utf-8") as f:
            content = f.read()
        if "server-only" not in content:
            content = "import 'server-only';\n\n" + content
            with open(fichier, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"✅ 'server-only' ajouté à {fichier}.")

print("\n🚀 Configuration de sécurité terminée !")
