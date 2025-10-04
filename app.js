const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

// Simple MIME type mapping
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }));
    return;
  }

  // API endpoints
  if (pathname === '/api/intake/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      totalMessages: 42,
      activeTickets: 8,
      slaCompliance: 95.2,
      riskScore: 23
    }));
    return;
  }

  if (pathname === '/api/messages/recent') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      messages: [
        {
          id: 'msg_001',
          channel: 'sms',
          content: '엘리베이터가 고장났어요',
          classification: 'common_facility',
          priority: 'high',
          status: 'processed',
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        },
        {
          id: 'msg_002',
          channel: 'web',
          content: '관리비 문의드립니다',
          classification: 'billing',
          priority: 'medium',
          status: 'assigned',
          createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
        }
      ]
    }));
    return;
  }

  // Handle POST requests for intake endpoints
  if (req.method === 'POST' && pathname.startsWith('/api/intake/')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          messageId: `${pathname.split('/').pop()}_${Date.now()}`,
          classification: 'inquiry',
          priority: 'medium',
          estimatedResponse: '2-4 hours'
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
  
  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File not found, serve index.html for SPA routing
      filePath = path.join(__dirname, 'public', 'index.html');
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`🚀 AI Secretary server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard.html`);
  console.log(`🧪 Test API: http://localhost:${PORT}/test.html`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
});

module.exports = server;