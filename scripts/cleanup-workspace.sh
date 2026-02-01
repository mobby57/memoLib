#!/usr/bin/env bash
set -euo pipefail

# MemoLib workspace cleanup utility
# - Dry-run by default: prints what would be removed with sizes
# - Pass --apply to actually delete
# - Focuses ONLY on build outputs and caches; avoids code, docs, data

APPLY=false
if [[ ${1:-} == "--apply" ]]; then
  APPLY=true
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
cd "$ROOT"

echo "Workspace: $ROOT"
echo "Mode: $([[ "$APPLY" == true ]] && echo APPLY || echo DRY-RUN)"

dirs=(
  ".next"
  "out"
  "dist"
  ".turbo"
  ".swc"
  ".wrangler"
  ".vercel/output"
  "coverage"
  "playwright-report"
  "__pycache__"
  ".pytest_cache"
  "node_modules/.cache"
  ".jest-cache"
)

files=(
  "tsconfig.tsbuildinfo"
  ".tsc-output.txt"
  "typescript-errors.txt"
  "bundle-report.html"
)

removed_any=false

echo "\nCandidates (directories):"
for d in "${dirs[@]}"; do
  if [[ -d "$d" ]]; then
    removed_any=true
    if [[ "$APPLY" == true ]]; then
      echo "  rm -rf $d"
      rm -rf "$d"
    else
      du -sh "$d" 2>/dev/null || echo "  $d (exists)"
    fi
  fi
done

echo "\nCandidates (files):"
for f in "${files[@]}"; do
  if [[ -f "$f" ]]; then
    removed_any=true
    if [[ "$APPLY" == true ]]; then
      echo "  rm -f $f"
      rm -f "$f"
    else
      ls -lah "$f"
    fi
  fi
done

if [[ "$APPLY" == true ]]; then
  echo "\n✅ Cleanup applied."
else
  if [[ "$removed_any" == true ]]; then
    echo "\nℹ️ Dry-run complete. Use --apply to delete the above items."
  else
    echo "\nNo removable artifacts found."
  fi
fi
