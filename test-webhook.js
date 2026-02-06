const http = require('http');

const data = JSON.stringify({
  channel: 'EMAIL',
  from: 'test@demo.com',
  subject: 'Test Pattern Adapter',
  body: 'Message de test du pattern adapter multi-canal',
  messageId: 'node-test-001',
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/webhooks/test-multichannel',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
};

const req = http.request(options, res => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);

  let body = '';
  res.on('data', chunk => {
    body += chunk;
  });

  res.on('end', () => {
    console.log('\nResponse:');
    try {
      const json = JSON.parse(body);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(body);
    }
  });
});

req.on('error', error => {
  console.error('Error:', error.message);
});

req.write(data);
req.end();
