#!/usr/bin/env node

const http = require('http');
const { URL } = require('url');

const BASE_URL = 'http://localhost:3000/api/webhooks/test-multichannel';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function request(method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  log(colors.blue, '\n=== AUDIT WEBHOOK PATTERN ADAPTER ===\n');

  try {
    // Test 1: GET endpoint
    log(colors.yellow, '📋 Test 1: GET /api/webhooks/test-multichannel');
    let result = await request('GET');
    if (result.status === 200 && result.data.examples) {
      log(colors.green, '✅ GET endpoint OK - Status', result.status);
      log(colors.green, '   Message:', result.data.message || result.data.description);
      log(
        colors.green,
        '   Exemples disponibles:',
        Object.keys(result.data.examples || {}).join(', ')
      );
    } else {
      log(colors.red, '❌ GET endpoint FAILED - Status', result.status);
      return;
    }

    await sleep(1000);

    // Test 2: POST Email
    log(colors.yellow, '\n📧 Test 2: POST email');
    const emailPayload = {
      channel: 'EMAIL',
      messageId: 'msg_' + Date.now(),
      from: 'client@example.com',
      to: 'cabinet@example.com',
      subject: 'Question urgente',
      text: "Bonjour, j'ai une question juridique...",
    };

    result = await request('POST', emailPayload);
    if (result.status === 200 && result.data.messageId) {
      log(colors.green, '✅ Email POST OK - Status', result.status);
      log(colors.green, '   messageId:', result.data.messageId);
      log(colors.green, '   checksum:', result.data.checksum);
      log(colors.green, '   status:', result.data.status);
    } else {
      log(colors.red, '❌ Email POST FAILED');
      log(colors.red, '   Status:', result.status);
      log(colors.red, '   Response:', JSON.stringify(result.data));
      return;
    }

    await sleep(1000);

    // Test 3: Deduplication (same email again)
    log(colors.yellow, '\n🔍 Test 3: Deduplication check (resend same email)');
    result = await request('POST', emailPayload);
    if (result.status === 409) {
      log(colors.green, '✅ Deduplication OK - Status', result.status);
      log(colors.green, '   Error:', result.data.error);
      log(colors.green, '   Message:', result.data.message);
    } else {
      log(colors.red, '❌ Deduplication FAILED - Expected 409, got', result.status);
      log(colors.red, '   Response:', JSON.stringify(result.data));
      return;
    }

    await sleep(1000);

    // Test 4: POST WhatsApp
    log(colors.yellow, '\n💬 Test 4: POST WhatsApp');
    const whatsappPayload = {
      channel: 'WHATSAPP',
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    id: 'wamid_' + Date.now(),
                    from: '+33612345678',
                    type: 'text',
                    text: { body: 'Message via WhatsApp' },
                  },
                ],
                contacts: [{ profile: { name: 'Marie Client' } }],
              },
            },
          ],
        },
      ],
    };

    result = await request('POST', whatsappPayload);
    if (result.status === 200 && result.data.messageId) {
      log(colors.green, '✅ WhatsApp POST OK - Status', result.status);
      log(colors.green, '   messageId:', result.data.messageId);
      log(colors.green, '   checksum:', result.data.checksum);
    } else {
      log(colors.red, '❌ WhatsApp POST FAILED - Status', result.status);
      log(colors.red, '   Response:', JSON.stringify(result.data));
    }

    await sleep(1000);

    // Test 5: POST SMS
    log(colors.yellow, '\n📱 Test 5: POST SMS');
    const smsPayload = {
      channel: 'SMS',
      MessageSid: 'SM' + Date.now(),
      From: '+33612345678',
      To: '+33698765432',
      Body: 'Message urgent via SMS',
    };

    result = await request('POST', smsPayload);
    if (result.status === 200 && result.data.messageId) {
      log(colors.green, '✅ SMS POST OK - Status', result.status);
      log(colors.green, '   messageId:', result.data.messageId);
      log(colors.green, '   checksum:', result.data.checksum);
    } else {
      log(colors.red, '❌ SMS POST FAILED - Status', result.status);
      log(colors.red, '   Response:', JSON.stringify(result.data));
    }

    log(colors.green, '\n=== 🎉 AUDIT COMPLETED ===\n');
  } catch (error) {
    log(colors.red, '\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  log(colors.red, 'Fatal error:', err);
  process.exit(1);
});
