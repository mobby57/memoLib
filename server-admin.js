const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8091;

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, 'admin', req.url === '/' ? 'index.html' : req.url);
    
    const extname = path.extname(filePath);
    const contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json'
    }[extname] || 'text/html';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('404 Not Found');
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*'
            });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Admin panel running on http://localhost:${PORT}`);
});
