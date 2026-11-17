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
    headers: {
      'Authorization': `Bearer ${SECRET}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function createOrUpdateUser({ email, username, password, firstName, lastName, role }) {
  const search = await clerkFetch('GET', `/users?email_address=${encodeURIComponent(email)}`);
  let userId = search.ok && search.data.length > 0 ? search.data[0].id : null;

  if (userId) {
    console.log(`⏭  Existe déjà : ${email} (${userId})`);
    return userId;
  }

  const create = await clerkFetch('POST', '/users', {
    email_address: [email],
    username: username,
    password: password,
    first_name: firstName,
    last_name: lastName,
    public_metadata: { role },
    skip_password_requirement: true,
  });

  if (create.ok) {
    console.log(`✅ Créé : ${email} → username: ${username} (${create.data.id})`);
    return create.data.id;
  } else {
    console.log(`❌ Erreur pour ${email} :`);
    console.log(JSON.stringify(create.data.errors || create.data, null, 2));
    return null;
  }
}

(async () => {
  console.log('🚀 Création des comptes de test Clerk...\n');

  const users = [
    {
      email: 'test+clerk_test@memolib.dev',
      username: 'maitre_dupont_demo',              // ✅ underscores au lieu de points
      password: 'Mem0L!b_Secure_2026#Dupont',
      firstName: 'Maître',
      lastName: 'Dupont',
      role: 'AVOCAT',
    },
    {
      email: 'client-test+clerk_test@memolib.dev',
      username: 'client_test_demo',                // ✅ underscores
      password: 'Mem0L!b_Secure_2026#Client',
      firstName: 'Client',
      lastName: 'Test',
      role: 'CLIENT',
    },
  ];

  for (const user of users) await createOrUpdateUser(user);
  console.log('\n🎉 Terminé.');
})();
