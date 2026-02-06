/**
 * Script pour créer les comptes de démo via l'API Next.js
 */

const createDemoAccounts = async () => {
  try {
    console.log('🔄 Tentative de création des comptes de démo...\n');

    // Créer le compte admin
    const adminResponse = await fetch('http://localhost:3000/api/auth/demo-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@memolib.fr',
        password: 'admin123',
        name: 'Admin Demo',
        role: 'SUPER_ADMIN',
      }),
    });

    if (adminResponse.ok) {
      console.log('✅ Admin créé: admin@memolib.fr');
    } else {
      console.log('⚠️  Admin existe déjà ou erreur');
    }

    // Créer le compte avocat
    const lawyerResponse = await fetch('http://localhost:3000/api/auth/demo-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'avocat@memolib.fr',
        password: 'admin123',
        name: 'Avocat Demo',
        role: 'LAWYER',
      }),
    });

    if (lawyerResponse.ok) {
      console.log('✅ Avocat créé: avocat@memolib.fr');
    } else {
      console.log('⚠️  Avocat existe déjà ou erreur');
    }

    // Créer le compte client
    const clientResponse = await fetch('http://localhost:3000/api/auth/demo-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'client@memolib.fr',
        password: 'demo123',
        name: 'Client Demo',
        role: 'CLIENT',
      }),
    });

    if (clientResponse.ok) {
      console.log('✅ Client créé: client@memolib.fr');
    } else {
      console.log('⚠️  Client existe déjà ou erreur');
    }

    console.log('\n========================================');
    console.log('   IDENTIFIANTS DE CONNEXION');
    console.log('========================================');
    console.log('   Admin:  admin@memolib.fr / admin123');
    console.log('   Avocat: avocat@memolib.fr / admin123');
    console.log('   Client: client@memolib.fr / demo123');
    console.log('========================================\n');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n⚠️  Assurez-vous que le serveur Next.js est démarré (npm run dev)');
  }
};

createDemoAccounts();
