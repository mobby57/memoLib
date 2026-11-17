const fs = require('fs');
const path = require('path');

function getClerkSecret() {
  const env = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
  const match = env.match(/CLERK_SECRET_KEY\s*=\s*"?([^"\r\n]+)"?/);
  if (!match) throw new Error('CLERK_SECRET_KEY introuvable');
  return match[1].trim();
}

const SECRET = getClerkSecret();
const BASE_URL = 'https://api.clerk.com/v1';

async function clerkFetch(method, endpoint, body) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: { 'Authorization': `Bearer ${SECRET}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function resetUser({ email, username, password, firstName, lastName, role }) {
  console.log(`\n👤 Reset de ${email}...`);
  
  // 1. Chercher et supprimer l'utilisateur existant
  const search = await clerkFetch('GET', `/users?email_address=${encodeURIComponent(email)}`);
  if (search.ok && search.data.length > 0) {
    const existingId = search.data[0].id;
    console.log(`   🗑  Suppression de l'ancien (${existingId})...`);
    await clerkFetch('DELETE', `/users/${existingId}`);
  }
  
  // 2. Recréer avec le bon mot de passe
  const create = await clerkFetch('POST', '/users', {
    email_address: [email],
    username: username,
    password: password,
    first_name: firstName,
    last_name: lastName,
    public_metadata: { role },
    skip_password_requirement: true, // Empêche Clerk de rejeter le mot de passe
  });
  
  if (create.ok) {
    console.log(`   ✅ Recréé (${create.data.id})`);
  } else {
    console.log(`   ❌ Erreur :`, JSON.stringify(create.data.errors || create.data, null, 2));
  }
}

(async () => {
  console.log('🔄 Reset complet des comptes Clerk...\n');
  await resetUser({
    email: 'test+clerk_test@memolib.dev',
    username: 'maitre_dupont_demo',
    password: 'Mem0L!b_Secure_2026#Dupont',
    firstName: 'Maître',
    lastName: 'Dupont',
    role: 'AVOCAT',
  });
  await resetUser({
    email: 'client-test+clerk_test@memolib.dev',
    username: 'client_test_demo',
    password: 'Mem0L!b_Secure_2026#Client',
    firstName: 'Client',
    lastName: 'Test',
    role: 'CLIENT',
  });
  console.log('\n🎉 Terminé. Les comptes sont prêts avec les bons mots de passe.');
})();
