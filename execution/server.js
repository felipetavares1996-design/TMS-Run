const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const PUBLIC_DIR = path.join(__dirname, '..');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Ignorar parâmetros de query se houverem
    const cleanUrl = req.url.split('?')[0];
    let filePath = path.join(PUBLIC_DIR, cleanUrl === '/' ? 'index.html' : cleanUrl);
    
    // Segurança: impede navegação fora do diretório público
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.statusCode = 403;
        res.end('Acesso proibido');
        return;
    }
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            // Se for pasta, tentar index.html daquela pasta
            if (err.code === 'EISDIR') {
                fs.readFile(path.join(filePath, 'index.html'), (indexErr, indexData) => {
                    if (indexErr) {
                        res.statusCode = 404;
                        res.end('Não encontrado');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end(indexData);
                    }
                });
                return;
            }
            
            res.statusCode = 404;
            res.end('Arquivo não encontrado');
            return;
        }
        
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`[OK] Servidor rodando localmente em http://127.0.0.1:${PORT}`);
    console.log('Pressione CTRL+C nesta janela para fechar o servidor.');
});
