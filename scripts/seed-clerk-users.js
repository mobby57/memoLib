// Script one-shot : crée les comptes de test dans Clerk
// Usage: node scripts/seed-clerk-users.js

import { clerkClient } from '@clerk/nextjs/server';

const USERS = [
  {
    email: 'test@memolib.dev',
    password: 'TestPassword123!',
    firstName: 'Maître',
    lastName: 'Dupont',
    role: 'AVOCAT',
  },
  {
    email: 'client-test@memolib.dev',
    password: 'ClientPassword123!',
    firstName: 'Client',
    lastName: 'Test',
    role: 'CLIENT',
  },
];

async function createOrUpdateUser({ email, password, firstName, lastName, role }) {
  try {
    // Cherche si l'utilisateur existe déjà
    const existing = await clerkClient.users.getUserList({ emailAddress: [email] });

    if (existing.data.length > 0) {
      const user = existing.data[0];
      console.log(`⏭  Existe déjà : ${email} (${user.id})`);
      // Force le mot de passe (au cas où il aurait été perdu)
      await clerkClient.users.updateUser(user.id, {
        password,
        skipPasswordChecks: true,
        publicMetadata: { role },
      });
      return user.id;
    }

    // Crée l'utilisateur
    const user = await clerkClient.users.createUser({
      emailAddress: [email],
      password,
      firstName,
      lastName,
      publicMetadata: { role },
      skipPasswordChecks: true,
    });
    console.log(`✅ Créé : ${email} (${user.id})`);
    return user.id;
  } catch (err) {
    console.error(`❌ Erreur pour ${email}:`, err.message);
    throw err;
  }
}

async function main() {
  console.log('🚀 Création des comptes de test Clerk...\n');
  for (const user of USERS) {
    await createOrUpdateUser(user);
  }
  console.log('\n🎉 Terminé.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
