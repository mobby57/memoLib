import os
import re

# Chemin du fichier à modifier
FICHIER = "src/lib/clerk-auth.ts"

if not os.path.exists(FICHIER):
    # On cherche s'il a une extension différente
    for ext in [".ts", ".tsx", ".js", ".jsx"]:
        if os.path.exists(f"src/lib/clerk-auth{ext}"):
            FICHIER = f"src/lib/clerk-auth{ext}"
            break
    else:
        print("❌ Impossible de trouver clerk-auth.ts ou .tsx")
        exit(1)

print(f"🔍 Analyse du fichier : {FICHIER}")

with open(FICHIER, "r", encoding="utf-8") as f:
    code = f.read()

# Sauvegarde
with open(FICHIER + ".bak", "w", encoding="utf-8") as f:
    f.write(code)
print(f"✅ Sauvegarde créée : {FICHIER}.bak")

# Vérifier si 'auth' est déjà exporté
if "export const auth" in code or "export function auth" in code or "export { auth }" in code:
    print("ℹ️ La fonction 'auth' semble déjà exportée. Rien à faire.")
else:
    # Chercher 'const auth' ou 'function auth'
    if re.search(r'(?<!export )const auth\s*=', code):
        code = re.sub(r'(?<!export )const auth\s*=', 'export const auth =', code)
        print("✅ Le mot-clé 'export' a été ajouté à 'const auth'.")
    elif re.search(r'(?<!export )function auth\s*\(', code):
        code = re.sub(r'(?<!export )function auth\s*\(', 'export function auth(', code)
        print("✅ Le mot-clé 'export' a été ajouté à 'function auth'.")
    else:
        # Si c'est un cas plus complexe (ex: import { auth as clerkAuth }), on force l'export à la fin
        code += "\nexport { auth };\n"
        print("✅ 'export { auth };' a été ajouté à la fin du fichier.")

    with open(FICHIER, "w", encoding="utf-8") as f:
        f.write(code)

print("🚀 Terminé ! Relance la vérification TypeScript :")
print("   NODE_OPTIONS=\"--max-old-space-size=6144\" ./node_modules/.bin/tsc --noEmit")
