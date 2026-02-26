// Test de connexion Upstash Redis
// Exécuter : npx tsx scripts/test-upstash.ts

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

async function testUpstash() {
  console.log('\n🔴 Test Upstash Redis\n');
  console.log('='.repeat(50));

  try {
    // Test 1: SET
    console.log('\n1️⃣  Test SET...');
    await redis.set('test:hello', 'Hello Upstash!');
    console.log('✅ SET OK');

    // Test 2: GET
    console.log('\n2️⃣  Test GET...');
    const value = await redis.get('test:hello');
    console.log(`✅ GET OK: ${value}`);

    // Test 3: SETEX (avec expiration)
    console.log('\n3️⃣  Test SETEX (expire 10s)...');
    await redis.setex('test:expire', 10, 'Expire soon');
    console.log('✅ SETEX OK');

    // Test 4: INCR
    console.log('\n4️⃣  Test INCR...');
    await redis.incr('test:counter');
    const counter = await redis.get('test:counter');
    console.log(`✅ INCR OK: ${counter}`);

    // Test 5: HASH
    console.log('\n5️⃣  Test HASH...');
    await redis.hset('test:user', { name: 'John', age: '30' });
    const name = await redis.hget('test:user', 'name');
    console.log(`✅ HASH OK: ${name}`);

    // Test 6: LIST
    console.log('\n6️⃣  Test LIST...');
    await redis.lpush('test:list', 'item1', 'item2', 'item3');
    const list = await redis.lrange('test:list', 0, -1);
    console.log(`✅ LIST OK: ${list.length} items`);

    // Test 7: DEL
    console.log('\n7️⃣  Test DEL...');
    await redis.del('test:hello', 'test:counter', 'test:user', 'test:list');
    console.log('✅ DEL OK');

    // Test 8: Performance
    console.log('\n8️⃣  Test Performance...');
    const start = Date.now();
    for (let i = 0; i < 10; i++) {
      await redis.set(`perf:${i}`, `value${i}`);
    }
    const duration = Date.now() - start;
    console.log(`✅ 10 SET en ${duration}ms (${(duration / 10).toFixed(1)}ms/op)`);

    // Cleanup
    for (let i = 0; i < 10; i++) {
      await redis.del(`perf:${i}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n🎉 Tous les tests réussis !');
    console.log('\n✅ Upstash Redis fonctionne parfaitement\n');
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    console.log('\n⚠️  Vérifiez vos credentials dans .env.local:');
    console.log('   UPSTASH_REDIS_REST_URL');
    console.log('   UPSTASH_REDIS_REST_TOKEN\n');
    process.exit(1);
  }
}

testUpstash();
