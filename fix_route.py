import os
FICHIER = "src/app/api/admin/logs/route.ts"
if os.path.exists(FICHIER):
    with open(FICHIER, "r", encoding="utf-8") as f:
        code = f.read()
    if "const { user } = await auth();" in code:
        code = code.replace("const { user } = await auth();", "const user = await currentUser();")
    if "currentUser" not in code:
        code = "import { currentUser } from '@clerk/nextjs/server';\n" + code
    with open(FICHIER, "w", encoding="utf-8") as f:
        f.write(code)
    print("✅ Fichier route.ts corrigé.")
