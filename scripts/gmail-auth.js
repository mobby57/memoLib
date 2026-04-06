const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const out = {};
  const content = fs.readFileSync(filePath, 'utf8');

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx <= 0) continue;

    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    out[key] = value;
  }

  return out;
}

function loadCredentialsJson(credentialsPath) {
  if (!fs.existsSync(credentialsPath)) return null;

  try {
    const raw = fs.readFileSync(credentialsPath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed.installed || parsed.web || null;
  } catch {
    return null;
  }
}

function getFirstDefined(values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function extractAuthorizationCode(input) {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';

  // Common mistake: pasted app login URL with nested callbackUrl param.
  // Try to decode callbackUrl recursively and extract code if present.
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const firstUrl = new URL(trimmed);
      const callbackUrlRaw = firstUrl.searchParams.get('callbackUrl');
      if (callbackUrlRaw) {
        const callbackDecoded = decodeURIComponent(callbackUrlRaw);
        const nestedMatch = callbackDecoded.match(/[?&]code=([^&#\s]+)/);
        if (nestedMatch && nestedMatch[1]) {
          return decodeURIComponent(nestedMatch[1]).trim();
        }
      }
    }
  } catch {
    // Ignore parse issues and continue with standard extraction.
  }

  const regexMatch = trimmed.match(/[?&]code=([^&#\s]+)/);
  if (regexMatch && regexMatch[1]) {
    try {
      return decodeURIComponent(regexMatch[1]).trim();
    } catch {
      return regexMatch[1].trim();
    }
  }

  // If user pastes a full redirect URL, extract ?code=...
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const codeFromQuery = url.searchParams.get('code');
      if (codeFromQuery && codeFromQuery.trim()) {
        return codeFromQuery.trim();
      }
      return '';
    } catch {
      return '';
    }
  }

  // If user pasted only the code, use it directly.
  return trimmed;
}

const root = process.cwd();
const envMap = parseEnvFile(path.join(root, '.env.local'));
const credentials = loadCredentialsJson(path.join(root, 'credentials.json'));
const tokenPath = path.join(root, 'token.json');

const clientId = getFirstDefined([
  process.env.GMAIL_CLIENT_ID,
  envMap.GMAIL_CLIENT_ID,
  credentials?.client_id,
]);

const clientSecret = getFirstDefined([
  process.env.GMAIL_CLIENT_SECRET,
  envMap.GMAIL_CLIENT_SECRET,
  credentials?.client_secret,
]);

const redirectUri = getFirstDefined([
  process.env.GMAIL_REDIRECT_URI,
  envMap.GMAIL_REDIRECT_URI,
  Array.isArray(credentials?.redirect_uris) ? credentials.redirect_uris[0] : '',
  'http://localhost:3000/oauth/callback',
]);

if (!clientId || !clientSecret) {
  console.error('\n[ERROR] Gmail OAuth configuration incomplete.');
  console.error('[ERROR] Missing client_id/client_secret.');
  console.error('\nActions:');
  console.error('1. Add credentials.json at the repository root (recommended).');
  console.error('2. OR set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env.local.');
  console.error('3. Re-run: npm run gmail:auth\n');
  process.exit(1);
}

if (redirectUri.startsWith('http://localhost:3000/')) {
  console.warn('\n[WARN] Redirect URI is on port 3000 (same as the app).');
  console.warn('[WARN] This often redirects to your login page and hides the OAuth code.');
  console.warn(
    '[WARN] Recommended: use a dedicated redirect URI, e.g. http://127.0.0.1:8085/oauth/callback,'
  );
  console.warn('[WARN] and add it to Google Cloud Authorized redirect URIs.\n');
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
  ],
});

console.log('\nGmail OAuth setup\n');
console.log(`Redirect URI: ${redirectUri}`);
console.log('\n1. Open this URL in your browser:\n');
console.log(authUrl);
console.log('\n2. Authorize the app');
console.log('3. Copy the authorization code from the redirect page\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Paste the code here: ', async code => {
  let success = false;

  try {
    const normalizedCode = extractAuthorizationCode(code);

    if (!normalizedCode) {
      console.error('OAuth error: missing authorization code.');
      console.error('Paste the final redirect URL containing ?code=... or paste only the code.');
      console.error(
        'If you are on a Google warning page, click Continue first, then copy the localhost callback URL.'
      );
      console.error(
        'If you pasted /fr/auth/login?callbackUrl=..., this is not the final OAuth callback.'
      );
      process.exitCode = 1;
      return;
    }

    const { tokens } = await oauth2Client.getToken(normalizedCode);

    console.log('\nAuthentication successful.\n');

    if (tokens.refresh_token) {
      const tokenPayload = {
        type: 'authorized_user',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokens.refresh_token,
      };

      fs.writeFileSync(tokenPath, JSON.stringify(tokenPayload, null, 2), 'utf8');
      console.log(`Saved OAuth token file: ${tokenPath}\n`);

      console.log('Add this line to your .env.local:\n');
      console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}\n`);
      success = true;
    } else {
      console.log('No refresh_token returned.');
      console.log('Tip: revoke app access then re-run with prompt=consent.\n');
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('OAuth error:', error.message);
    process.exitCode = 1;
  } finally {
    if (!success && process.exitCode === undefined) {
      process.exitCode = 1;
    }
    rl.close();
  }
});
