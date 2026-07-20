const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const ALLOWED_SAVE_FILES = [
    'stellarObjects.js',
    'regions.js',
    'largeAsteroids.js',
    'nebulas.js',
    'tradeRoutes.js',
    'clusters.js'
];

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // API save endpoint
    if (req.method === 'POST' && req.url === '/api/save') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { filename, content } = data;

                if (!ALLOWED_SAVE_FILES.includes(filename)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Filename not allowed' }));
                    return;
                }

                const filePath = path.join(__dirname, 'src', 'data', filename);
                fs.writeFileSync(filePath, content, 'utf8');

                console.log(`[Editor Server] Saved ${filename} successfully.`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: `${filename} saved successfully.` }));
            } catch (err) {
                console.error('[Editor Server] Save error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to save file: ' + err.message }));
            }
        });
        return;
    }

    // Static files
    let reqUrl = req.url;
    if (reqUrl === '/' || reqUrl === '/editor') {
        reqUrl = '/editor.html';
    }

    // Clean query parameters/hash from URL
    const cleanUrl = reqUrl.split('?')[0].split('#')[0];
    const filePath = path.join(__dirname, cleanUrl);

    // Simple security check: prevent directory traversal
    const relative = path.relative(__dirname, filePath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': mimeType });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🛸 Space Explorer Map Editor server is active!`);
    console.log(`👉 Open: http://localhost:${PORT}/editor.html`);
    console.log(`======================================================\n`);
});
