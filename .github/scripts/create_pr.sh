#!/usr/bin/env bash
set -euo pipefail

REPO_OWNER="mobby57"
REPO_NAME="memoLib"
HEAD_BRANCH="feat/update-memo-template"
BASE_BRANCH="main"

echo "This script will create a PR from $HEAD_BRANCH -> $BASE_BRANCH on $REPO_OWNER/$REPO_NAME"
read -p "Press Enter to continue or Ctrl-C to cancel..."

read -s -p "Paste your GITHUB_TOKEN (will not be echoed): " GITHUB_TOKEN
echo
if [ -z "${GITHUB_TOKEN}" ]; then
  echo "No token provided, aborting."
  exit 1
fi

DEFAULT_TITLE="docs: update MEMO_LIB_TEMPLATE and CI"
read -p "PR title (enter for default): " TITLE
TITLE=${TITLE:-$DEFAULT_TITLE}

BODY="Résumé : enrichit MEMO_LIB_TEMPLATE.md (métadatas, checklist), ajoute workflow CI et migre usage Redis vers Upstash. Voir fichiers modifiés."

API_URL="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls"


export PR_TITLE="$TITLE"
export PR_BODY="$BODY"
export PR_HEAD="$HEAD_BRANCH"
export PR_BASE="$BASE_BRANCH"

PAYLOAD=$(python3 - <<'PY'
import os, json
payload = {
    "title": os.environ['PR_TITLE'],
    "head": os.environ['PR_HEAD'],
    "base": os.environ['PR_BASE'],
    "body": os.environ['PR_BODY'],
}
print(json.dumps(payload))
PY
)

echo "Creating PR..."
resp=$(curl -s -X POST -H "Authorization: token ${GITHUB_TOKEN}" -H "Accept: application/vnd.github+json" "$API_URL" -d "$PAYLOAD")

echo
echo "Raw response from GitHub API:"
echo "$resp"
echo
echo "Parsed response:"
echo "$resp" | python3 - <<'PY'
import sys, json
try:
    r = json.load(sys.stdin)
    if isinstance(r, dict) and 'html_url' in r:
        print('PR created:', r['html_url'])
    else:
        print('API response:', json.dumps(r, ensure_ascii=False, indent=2))
except Exception as e:
    print('Could not parse response:', e)
    print(sys.stdin.read())
PY

echo
echo "If the PR was created, consider revoking the token or restricting its scope after use."
