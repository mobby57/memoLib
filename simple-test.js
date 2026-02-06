#!/usr/bin/env node
const http = require('http');
const fs = require('fs');

console.log('Starting test server on port 8888...');

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  if (req.url === '/test1') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, test: 1 }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(8888, () => {
  console.log('✅ Test server running on http://localhost:8888');

  // Now test the actual Next.js server
  console.log('\nTesting localhost:3000...');

  const testNextJs = () => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/health',
        method: 'GET',
        timeout: 2000,
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          console.log(`✅ Next.js responded: Status ${res.statusCode}`);
          console.log(`Response: ${data.substring(0, 100)}`);
          process.exit(0);
        });
      }
    );

    req.on('error', e => {
      console.log(`❌ Next.js error: ${e.message}`);
      process.exit(1);
    });

    req.end();
  };

  setTimeout(testNextJs, 1000);
});
