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
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.4',
      commit: 'a581257'
    }));
    return;
  }

  // Version endpoint
  if (pathname === '/api/version') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      version: '1.0.9',
      commit: 'latest',
      buildTime: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }));
    return;
  }

  // API endpoints
  if (pathname === '/api/intake/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        totalMessages: 42,
        activeTickets: 8,
        slaCompliance: 95.2,
        riskScore: 23,
        recentMessages: [
          {
            id: 'msg_001',
            channel: 'sms',
            sender: '010-1234-5678',
            content: '엘리베이터가 고장났어요',
            classification: 'common_facility',
            priority: 'high',
            status: 'processed',
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
          },
          {
            id: 'msg_002',
            channel: 'web',
            sender: '입주민',
            content: '관리비 문의드립니다',
            classification: 'billing',
            priority: 'medium',
            status: 'assigned',
            createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
          },
          {
            id: 'msg_003',
            channel: 'email',
            sender: 'resident@example.com',
            content: '주차 문제 해결 요청',
            classification: 'parking',
            priority: 'medium',
            status: 'open',
            createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString()
          }
        ]
      }
    }));
    return;
  }

  if (pathname === '/api/intake/llm/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        enabled: true,
        available: true,
        config: {
          model: 'Mistral-7B',
          provider: 'Ollama'
        }
      }
    }));
    return;
  }

  if (pathname === '/api/intake/llm/toggle') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'LLM toggled successfully'
    }));
    return;
  }

  if (pathname === '/api/intake/messages' || pathname.startsWith('/api/intake/messages?')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: [
        {
          id: 'msg_001',
          channel: 'sms',
          from: '010-1234-5678',
          content: '101동 1502호 엘리베이터가 고장났어요',
          classification: 'common_facility',
          category: 'facility',
          priority: 'high',
          status: 'processed',
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          apartmentUnit: { dong: '101', ho: '1502' }
        },
        {
          id: 'msg_002',
          channel: 'web',
          from: 'resident@example.com',
          content: '관리비 문의드립니다',
          classification: 'billing',
          category: 'billing',
          priority: 'medium',
          status: 'assigned',
          createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          apartmentUnit: { dong: '102', ho: '805' }
        },
        {
          id: 'msg_003',
          channel: 'sms',
          from: '010-9876-5432',
          content: '윗집 소음이 심합니다',
          classification: 'noise',
          category: 'noise',
          priority: 'medium',
          status: 'processed',
          createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          apartmentUnit: { dong: '103', ho: '1205' }
        }
      ]
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

  // Additional API endpoints for dashboard
  if (pathname === '/api/tickets/staff') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: [
        { 
          id: 'staff_001', 
          name: '김관리', 
          role: '소장', 
          active: true,
          specialties: ['시설관리', '민원처리', '안전관리']
        },
        { 
          id: 'staff_002', 
          name: '이직원', 
          role: '관리사무소', 
          active: true,
          specialties: ['회계', '관리비', '입주민상담']
        }
      ]
    }));
    return;
  }

  if (pathname === '/api/tickets/sla/dashboard') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      slaCompliance: 95.2,
      avgResponseTime: 2.3,
      overdueTickets: 3
    }));
    return;
  }

  if (pathname === '/api/tickets' || pathname.startsWith('/api/tickets?')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: [
        {
          id: 'ticket_001',
          number: 'TKT-001',
          title: '엘리베이터 고장 신고',
          status: 'open',
          priority: 'high',
          assignee: 'staff_001',
          slaDeadline: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
          createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
        },
        {
          id: 'ticket_002',
          number: 'TKT-002',
          title: '관리비 문의',
          status: 'in_progress',
          priority: 'medium',
          assignee: 'staff_002',
          slaDeadline: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
          createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString()
        }
      ]
    }));
    return;
  }

  if (pathname === '/api/risk/dashboard') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        riskScore: 23,
        alerts: [],
        trends: { increasing: false }
      }
    }));
    return;
  }

  if (pathname === '/api/tickets/workload/analytics') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: [
        {
          staffInfo: { 
            id: 'staff_001', 
            name: '김관리', 
            role: '소장',
            specialties: ['시설관리', '민원처리', '안전관리']
          },
          totalTickets: 5,
          openTickets: 2,
          inProgressTickets: 2,
          resolvedTickets: 1
        },
        {
          staffInfo: { 
            id: 'staff_002', 
            name: '이직원', 
            role: '관리사무소',
            specialties: ['회계', '관리비', '입주민상담']
          },
          totalTickets: 3,
          openTickets: 1,
          inProgressTickets: 1,
          resolvedTickets: 1
        }
      ]
    }));
    return;
  }

  // Reports endpoints
  if (pathname === '/api/reports/units/analytics' || pathname.startsWith('/api/reports/units/analytics?')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        summary: {
          totalActiveUnits: 5,
          totalRequests: 20,
          averageRequestsPerUnit: 4.0
        },
        metrics: {
          averageRequestsPerUnit: 4.0,
          mostActiveBuilding: '101동',
          peakPeriod: '저녁 (18:00-22:00)'
        },
        topUnits: [
          {
            apartmentUnit: { 
              dong: '101', 
              ho: '1502',
              formatted: '101동 1502호',
              floor: 15
            },
            requestCount: 12,
            totalRequests: 12,
            primaryCategory: 'noise',
            categories: { noise: 8, facility: 3, parking: 1 },
            lastRequestDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
          },
          {
            apartmentUnit: { 
              dong: '102', 
              ho: '805',
              formatted: '102동 805호',
              floor: 8
            },
            requestCount: 8,
            totalRequests: 8,
            primaryCategory: 'facility',
            categories: { facility: 5, noise: 2, other: 1 },
            lastRequestDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
          }
        ]
      }
    }));
    return;
  }

  if (pathname.startsWith('/api/reports/units/') && pathname.includes('/history')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        requests: [],
        pagination: { page: 1, limit: 10, total: 0 }
      }
    }));
    return;
  }

  // Handle individual ticket requests
  if (pathname.startsWith('/api/tickets/') && pathname !== '/api/tickets/staff' && pathname !== '/api/tickets/sla/dashboard') {
    const ticketId = pathname.split('/')[3];
    if (ticketId) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          id: ticketId,
          title: '엘리베이터 고장 신고',
          content: '엘리베이터가 고장났어요. 빨리 수리해주세요.',
          status: 'open',
          priority: 'high',
          assignee: 'staff_001',
          createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          updatedAt: new Date().toISOString()
        }
      }));
      return;
    }
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

  // Handle PATCH requests for ticket updates
  if (req.method === 'PATCH' && pathname.startsWith('/api/')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Updated successfully'
      }));
    });
    return;
  }

  // Handle other POST requests
  if (req.method === 'POST' && pathname.startsWith('/api/')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Created successfully'
      }));
    });
    return;
  }

  // Handle DELETE requests
  if (req.method === 'DELETE' && pathname.startsWith('/api/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Deleted successfully'
    }));
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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AI Secretary server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard.html`);
  console.log(`🧪 Test API: http://localhost:${PORT}/test.html`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
});

module.exports = server;