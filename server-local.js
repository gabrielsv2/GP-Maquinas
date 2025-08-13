const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const API_BASE_URL = 'https://gp-maquinas-backend.onrender.com';

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

// Proxy function for API requests
function proxyRequest(req, res, targetPath) {
    console.log(`🔄 Proxying request to: ${API_BASE_URL}${targetPath}`);
    
    const options = {
        hostname: 'gp-maquinas-backend.onrender.com',
        port: 443,
        path: targetPath,
        method: req.method,
        headers: {
            ...req.headers,
            host: 'gp-maquinas-backend.onrender.com'
        }
    };

    const proxyReq = https.request(options, (proxyRes) => {
        console.log(`📡 Proxy response status: ${proxyRes.statusCode}`);
        
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
        
        // Copy response headers
        Object.keys(proxyRes.headers).forEach(key => {
            if (key.toLowerCase() !== 'access-control-allow-origin') {
                res.setHeader(key, proxyRes.headers[key]);
            }
        });
        
        res.writeHead(proxyRes.statusCode);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error('❌ Proxy error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
    });

    // Handle request body
    if (req.method === 'POST' || req.method === 'PUT') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            proxyReq.write(body);
            proxyReq.end();
        });
    } else {
        proxyReq.end();
    }
}

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    // Parse URL
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;

    // Set CORS headers for all responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Proxy API requests
    if (pathname.startsWith('/api/')) {
        proxyRequest(req, res, pathname);
        return;
    }

    // Default to index.html
    if (pathname === '/') {
        pathname = '/index.html';
    }

    // Get file path
    const filePath = path.join(__dirname, pathname);
    const extname = path.extname(filePath).toLowerCase();

    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File not found
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
                <html>
                    <head><title>404 - File Not Found</title></head>
                    <body>
                        <h1>404 - File Not Found</h1>
                        <p>The requested file "${pathname}" was not found.</p>
                        <p><a href="/">Go to Home</a></p>
                        <p><a href="/test-api.html">Go to API Test</a></p>
                    </body>
                </html>
            `);
            return;
        }

        // Read and serve file
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end(`
                    <html>
                        <head><title>500 - Internal Server Error</title></head>
                        <body>
                            <h1>500 - Internal Server Error</h1>
                            <p>Error reading file: ${err.message}</p>
                        </body>
                    </html>
                `);
                return;
            }

            // Set content type
            const contentType = mimeTypes[extname] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Servidor local rodando em http://localhost:${PORT}`);
    console.log(`📁 Servindo arquivos do diretório: ${__dirname}`);
    console.log(`🔄 Proxy API configurado para: ${API_BASE_URL}`);
    console.log(`🔗 Links úteis:`);
    console.log(`   - Aplicação principal: http://localhost:${PORT}/index.html`);
    console.log(`   - Teste da API: http://localhost:${PORT}/test-api.html`);
    console.log(`   - Dashboard Admin: http://localhost:${PORT}/admin-dashboard.html`);
    console.log(`   - API Health Check: http://localhost:${PORT}/api/health`);
    console.log(`\n💡 Para parar o servidor, pressione Ctrl+C`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Parando servidor...');
    server.close(() => {
        console.log('✅ Servidor parado com sucesso');
        process.exit(0);
    });
});
