const fs = require('fs');
const path = require('path');

const root = process.cwd();
const envFile = path.join(root, '.env.local');
const credentialsFile = path.join(root, 'credentials.json');
const tokenFile = path.join(root, 'token.json');

function parseEnvFile(filePath) {
  const result = {};
  if (!fs.existsSync(filePath)) {
    return result;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    result[key] = value;
  }

  return result;
}

function resolveValue(key, envMap) {
  const processValue = process.env[key];
  if (processValue && processValue.trim()) {
    return processValue.trim();
  }

  const fileValue = envMap[key];
  if (fileValue && fileValue.trim()) {
    return fileValue.trim();
  }

  return '';
}

function printCheck(label, ok, detail) {
  const icon = ok ? 'OK' : 'MISSING';
  console.log(`${icon.padEnd(8)} ${label}${detail ? ` : ${detail}` : ''}`);
}

(function main() {
  console.log('\n=== Validation config demo client (sarraboudjellal57) ===\n');

  const envMap = parseEnvFile(envFile);
  const requiredEnvKeys = ['DEFAULT_TENANT_ID'];
  const optionalEnvKeys = [
    'TENANT_ID',
    'GMAIL_CLIENT_ID',
    'GMAIL_CLIENT_SECRET',
    'GMAIL_REFRESH_TOKEN',
  ];

  let hasError = false;

  for (const key of requiredEnvKeys) {
    const value = resolveValue(key, envMap);
    const ok = Boolean(value);
    printCheck(key, ok, ok ? 'configured' : 'required for integrated monitor persistence');
    if (!ok) hasError = true;
  }

  for (const key of optionalEnvKeys) {
    const value = resolveValue(key, envMap);
    printCheck(
      key,
      Boolean(value),
      value ? 'configured' : 'optional (needed if you use oauth helper script)'
    );
  }

  printCheck(
    'credentials.json',
    fs.existsSync(credentialsFile),
    fs.existsSync(credentialsFile) ? 'present' : 'required for first Gmail OAuth flow'
  );
  printCheck(
    'token.json',
    fs.existsSync(tokenFile),
    fs.existsSync(tokenFile) ? 'present' : 'will be created after OAuth auth'
  );

  if (!fs.existsSync(credentialsFile)) {
    hasError = true;
  }

  if (hasError) {
    console.error('\nConfiguration incomplete. See DEMO_CLIENT_SARRAB.md for exact setup steps.\n');
    process.exit(1);
  }

  console.log(
    '\nConfiguration valid. You can start demo flow with: npm run demo:client:sarrab:run\n'
  );
})();
