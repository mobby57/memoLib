import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000';
const TENANT_ID = '07f62515-f962-4f20-b76c-933fd80ffab9'; // Tenant démo
const USER_ID = 'b8aa6a12-3c78-4d4c-a027-f45d205f90e5'; // Super admin

async function testAPIs() {
  console.log('🧪 Test des API routes...\n');

  try {
    // 1. Test InformationUnit
    console.log('1️⃣ Test InformationUnit API');
    const infoUnitRes = await fetch(`${BASE_URL}/api/information-units`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TENANT_ID,
        source: 'EMAIL',
        content: 'Test email content from verification script',
        changedBy: USER_ID,
      }),
    });
    const infoUnit = await infoUnitRes.json();
    console.log(infoUnitRes.ok ? '✅ InformationUnit créée' : '❌ Erreur:', infoUnit);

    // 2. Test LegalDeadline
    console.log('\n2️⃣ Test LegalDeadline API');
    const deadlineRes = await fetch(`${BASE_URL}/api/legal-deadlines?tenantId=${TENANT_ID}`);
    const deadlines = await deadlineRes.json();
    console.log(deadlineRes.ok ? `✅ LegalDeadline: ${deadlines.total || 0} trouvés` : '❌ Erreur:', deadlines);

    // 3. Test Proof
    console.log('\n3️⃣ Test Proof API');
    const proofRes = await fetch(`${BASE_URL}/api/proofs?tenantId=${TENANT_ID}`);
    const proofs = await proofRes.json();
    console.log(proofRes.ok ? `✅ Proof: ${proofs.total || 0} trouvés` : '❌ Erreur:', proofs);

    // 4. Test AuditLog
    console.log('\n4️⃣ Test AuditLog API');
    const auditRes = await fetch(`${BASE_URL}/api/audit-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: TENANT_ID,
        userId: USER_ID,
        userEmail: 'admin@iapostemanage.com',
        userRole: 'super_admin',
        action: 'CREATE',
        entityType: 'Test',
        entityId: 'test-123',
      }),
    });
    const audit = await auditRes.json();
    console.log(auditRes.ok ? '✅ AuditLog créé' : '❌ Erreur:', audit);

    console.log('\n🎉 Tests terminés !');
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testAPIs();
