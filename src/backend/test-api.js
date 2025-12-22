// 🧪 TEST API - IAPosteManager v3.0
const BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
  console.log('🧪 Test API IAPosteManager v3.0');
  console.log('================================\n');

  // Test Health Check
  try {
    const health = await fetch(`${BASE_URL}/health`);
    const healthData = await health.json();
    console.log('✅ Health Check:', healthData.status);
  } catch (error) {
    console.log('❌ Health Check failed:', error.message);
    return;
  }

  // Test Auth Login
  try {
    const login = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'admin123' })
    });
    const loginData = await login.json();
    console.log('✅ Auth Login:', loginData.success ? 'OK' : 'FAILED');
    
    if (loginData.token) {
      const token = loginData.token;
      
      // Test Templates
      const templates = await fetch(`${BASE_URL}/templates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const templatesData = await templates.json();
      console.log('✅ Templates:', templatesData.success ? `${templatesData.templates.length} templates` : 'FAILED');
      
      // Test Contacts
      const contacts = await fetch(`${BASE_URL}/contacts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const contactsData = await contacts.json();
      console.log('✅ Contacts:', contactsData.success ? `${contactsData.contacts.length} contacts` : 'FAILED');
      
      // Test Dashboard
      const dashboard = await fetch(`${BASE_URL}/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dashboardData = await dashboard.json();
      console.log('✅ Dashboard:', dashboardData.success ? 'Stats OK' : 'FAILED');
    }
  } catch (error) {
    console.log('❌ Auth test failed:', error.message);
  }

  console.log('\n🎉 Tests terminés!');
}

testAPI();