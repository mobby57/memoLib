#!/usr/bin/env bash
set -euo pipefail

# MemoLib workspace cleanup utility
# - Dry-run by default: prints what would be removed with sizes
# - Pass --apply to actually delete
# - Pass --aggressive to include additional caches/reports
# - Focuses ONLY on build outputs and caches; avoids code, docs, data

APPLY=false
AGGRESSIVE=false

for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=true ;;
    --aggressive) AGGRESSIVE=true ;;
    *) ;;
  esac
done

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
cd "$ROOT"

echo "Workspace: $ROOT"
echo -n "Mode: "
if [[ "$APPLY" == true ]]; then echo -n "APPLY "; else echo -n "DRY-RUN "; fi
if [[ "$AGGRESSIVE" == true ]]; then echo "(+ AGGRESSIVE)"; else echo; fi

shopt -s nullglob dotglob

# Base candidates (safe)
dir_globs=(
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
  "src/frontend/.next"
  "src/frontend/out"
)

file_globs=(
  "tsconfig.tsbuildinfo"
  ".tsc-output.txt"
  "typescript-errors.txt"
  "bundle-report.html"
)

# Aggressive candidates (additional caches/reports only)
if [[ "$AGGRESSIVE" == true ]]; then
  dir_globs+=(
    ".cache_ggshield"
    ".open-next"
    ".vercel/output"
    ".wrangler"
    ".zap"
    "test-results"
    ".npm/_logs"
    "diagnostics"
  )
  file_globs+=(
    "npm-debug.log*"
    "lerna-debug.log*"
    "**/*.log"
  )
fi

removed_any=false

echo -e "\nCandidates (directories):"
for pattern in "${dir_globs[@]}"; do
  for d in $pattern; do
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
done

echo -e "\nCandidates (files):"
for pattern in "${file_globs[@]}"; do
  for f in $pattern; do
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
done

if [[ "$APPLY" == true ]]; then
  echo -e "\n✅ Cleanup applied."
else
  if [[ "$removed_any" == true ]]; then
    echo -e "\nℹ️ Dry-run complete. Use --apply to delete the above items."
  else
    echo -e "\nNo removable artifacts found."
  fi
fi
