#!/usr/bin/env python3
"""fix-logger-mock.py — Étend le mock logger avec info/warn/debug."""
import shutil
from datetime import datetime
from pathlib import Path

TS = datetime.now().strftime("%Y%m%d-%H%M%S")
p = Path("src/__tests__/api/compliance-routes.test.ts")

if not p.exists():
    print(f"✗ {p} introuvable")
    raise SystemExit(1)

bak = p.with_suffix(p.suffix + f".bak-{TS}")
shutil.copy2(p, bak)
print(f"✓ backup : {bak.name}")

src = p.read_text()

old = "vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));"
new = "vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));"

if old in src:
    src = src.replace(old, new)
    p.write_text(src)
    print("✓ mock logger étendu (info/warn/debug)")
elif "info: vi.fn()" in src:
    print("⏭  logger.info déjà mocké")
else:
    print("⚠  pattern non trouvé — regarde la ligne 'vi.mock(@/lib/logger'")
    print("   dans src/__tests__/api/compliance-routes.test.ts")

print()
print("═" * 60)
print("Vérifie :")
print("  npx vitest run src/__tests__/api/compliance-routes.test.ts 2>&1 | tail -10")
print("  npx vitest run 2>&1 | tail -12")
print("═" * 60)
