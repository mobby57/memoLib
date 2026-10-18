import { saasSignup } from './src/lib/services/saas-provisioning';

(async () => {
  try {
    const result = await saasSignup({
      firstName: 'Test',
      lastName: 'Debug',
      email: 'debug-' + Date.now() + '@example.com',
      password: 'TestPassword123!',
      cabinetName: 'Cabinet Debug',
      plan: 'CABINET',
      billingPeriod: 'monthly',
    });
    console.log('SUCCESS:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('FAILED');
    if (error instanceof Error) {
      console.error('MESSAGE:', error.message);
      console.error('STACK:', error.stack?.split('\n').slice(0, 8).join('\n'));
    } else {
      console.error('RAW:', error);
    }
  }
})();
