const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5501;
const HOST = '127.0.0.1';

const server = http.createServer((req, res) => {
    // Remove /spotify-api-project prefix if present
    let urlPath = req.url.split('?')[0];
    
    if (urlPath.startsWith('/spotify-api-project')) {
        urlPath = urlPath.slice('/spotify-api-project'.length);
    }
    
    // Default to index.html for root or empty path
    if (urlPath === '' || urlPath === '/') {
        urlPath = '/index.html';
    }
    
    // Construct full file path
    const filePath = path.join(__dirname, urlPath);
    
    // Security: prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    const normalizedBase = path.normalize(__dirname);
    if (!normalizedPath.startsWith(normalizedBase)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }
    
    // Try to serve the file
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.log(`File not found: ${filePath}`);
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`<h1>404 Not Found</h1><p>Requested: ${req.url}</p><p>Path: ${filePath}</p>`);
            return;
        }
        
        // Determine content type
        const ext = path.extname(filePath).toLowerCase();
        const contentTypes = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon'
        };
        
        const contentType = contentTypes[ext] || 'application/octet-stream';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(PORT, HOST, () => {
    console.log(`🎵 Spotify API Server running at http://${HOST}:${PORT}/spotify-api-project/`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log(`Press Ctrl+C to stop the server`);
});
