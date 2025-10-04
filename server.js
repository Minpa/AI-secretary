const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    service: 'AI Secretary'
  });
});

// API Routes
app.get('/api/intake/stats', (req, res) => {
  res.json({
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
        },
        {
          id: 'msg_003',
          channel: 'email',
          content: '주차장 불법주차 신고',
          classification: 'parking',
          priority: 'medium', 
          status: 'pending',
          createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString()
        }
      ]
    }
  });
});

app.post('/api/intake/sms', (req, res) => {
  const { phone, message } = req.body;
  console.log('SMS intake:', { phone, message });
  res.json({
    success: true,
    messageId: `sms_${Date.now()}`,
    classification: 'inquiry',
    priority: 'medium',
    estimatedResponse: '2-4 hours'
  });
});

app.post('/api/intake/email', (req, res) => {
  const { email, subject, message } = req.body;
  console.log('Email intake:', { email, subject, message });
  res.json({
    success: true,
    messageId: `email_${Date.now()}`,
    classification: 'inquiry',
    priority: 'medium',
    estimatedResponse: '4-8 hours'
  });
});

app.post('/api/intake/web', (req, res) => {
  const { name, unit, category, message } = req.body;
  console.log('Web intake:', { name, unit, category, message });
  res.json({
    success: true,
    messageId: `web_${Date.now()}`,
    classification: category || 'inquiry',
    priority: 'medium',
    estimatedResponse: '1-2 hours'
  });
});

app.post('/api/intake/call', (req, res) => {
  const { caller, duration, summary } = req.body;
  console.log('Call intake:', { caller, duration, summary });
  res.json({
    success: true,
    messageId: `call_${Date.now()}`,
    classification: 'inquiry',
    priority: 'high',
    estimatedResponse: 'immediate'
  });
});

app.get('/api/messages/recent', (req, res) => {
  const recentMessages = [
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
    },
    {
      id: 'msg_003',
      channel: 'email',
      content: '주차장 불법주차 신고',
      classification: 'parking',
      priority: 'medium', 
      status: 'pending',
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString()
    }
  ];
  
  res.json({ messages: recentMessages });
});

// SLA Dashboard endpoint
app.get('/api/tickets/sla/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      totalTickets: 8,
      slaPerformance: 95.2,
      averageResponseTime: 2.5,
      overdueTickets: 1
    }
  });
});

// Staff endpoint
app.get('/api/tickets/staff', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'staff_001',
        name: '김관리',
        role: '관리소장',
        department: '관리사무소',
        active: true
      },
      {
        id: 'staff_002',
        name: '박경비',
        role: '경비원',
        department: '보안팀',
        active: true
      },
      {
        id: 'staff_003',
        name: '이미화',
        role: '미화원',
        department: '청소팀',
        active: true
      }
    ]
  });
});

// Risk dashboard endpoint
app.get('/api/risk/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      riskScore: 23,
      riskLevel: 'low',
      riskFactors: [
        { name: '미해결 긴급 티켓', value: 1, weight: 0.3 },
        { name: 'SLA 위반', value: 2, weight: 0.25 },
        { name: '반복 민원', value: 3, weight: 0.2 }
      ],
      recommendations: [
        '긴급 티켓 우선 처리 필요',
        'SLA 모니터링 강화',
        '반복 민원 근본 원인 분석'
      ]
    }
  });
});

// Test endpoint
app.get('/api/intake/test', (req, res) => {
  res.json({
    success: true,
    message: 'API 테스트 성공',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/intake/stats',
      '/api/tickets/sla/dashboard', 
      '/api/tickets',
      '/api/tickets/staff',
      '/api/risk/dashboard'
    ]
  });
});

// Individual ticket endpoint
app.get('/api/tickets/:id', (req, res) => {
  const ticketId = req.params.id;
  
  // Mock ticket data - in real app this would come from database
  const tickets = {
    'ticket_001': {
      id: 'ticket_001',
      number: 'T-2025-001',
      title: '엘리베이터 고장 신고',
      description: '1층 엘리베이터가 작동하지 않습니다. 버튼을 눌러도 반응이 없고, 문이 열리지 않습니다.',
      status: 'assigned',
      priority: 'high',
      assignee: '김관리',
      assigneeId: 'staff_001',
      reporter: '101동 502호 김민수',
      category: 'common_facility',
      intakeMessageId: 'msg_001',
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
      slaDeadline: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
      comments: [
        {
          id: 'comment_001',
          author: '김관리',
          content: '엘리베이터 업체에 연락했습니다. 오늘 오후 2시에 수리 예정입니다.',
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        }
      ]
    },
    'ticket_002': {
      id: 'ticket_002',
      number: 'T-2025-002',
      title: '관리비 문의',
      description: '이번 달 관리비가 평소보다 높게 나왔는데, 세부 내역을 확인하고 싶습니다.',
      status: 'pending',
      priority: 'medium',
      assignee: null,
      assigneeId: null,
      reporter: '102동 301호 박영희',
      category: 'billing',
      createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
      slaDeadline: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
      comments: []
    },
    'ticket_003': {
      id: 'ticket_003',
      number: 'T-2025-003',
      title: '주차장 불법주차',
      description: '지하주차장 B1층에 외부 차량이 무단 주차되어 있습니다. 번호판: 서울12가3456',
      status: 'processed',
      priority: 'medium',
      assignee: '박경비',
      assigneeId: 'staff_002',
      reporter: '103동 201호 이철수',
      category: 'parking',
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      dueDate: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      slaDeadline: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      comments: [
        {
          id: 'comment_002',
          author: '박경비',
          content: '해당 차량 견인 조치 완료했습니다.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
        }
      ]
    }
  };
  
  const ticket = tickets[ticketId];
  
  if (!ticket) {
    return res.status(404).json({
      success: false,
      error: 'Ticket not found'
    });
  }
  
  res.json({
    success: true,
    data: ticket
  });
});

// Get intake message by ID
app.get('/api/intake/messages/:id', (req, res) => {
  const messageId = req.params.id;
  
  // Mock message data
  const messages = {
    'msg_001': {
      id: 'msg_001',
      channel: 'sms',
      content: '1층 엘리베이터가 작동하지 않습니다. 버튼을 눌러도 반응이 없고, 문이 열리지 않습니다.',
      maskedContent: '1층 엘리베이터가 작동하지 않습니다. 버튼을 눌러도 반응이 없고, 문이 열리지 않습니다.',
      sender: '010-1234-5678',
      maskedSender: '010-****-5678',
      classification: 'common_facility',
      priority: 'high',
      status: 'processed',
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    }
  };
  
  const message = messages[messageId];
  
  if (!message) {
    return res.status(404).json({
      success: false,
      error: 'Message not found'
    });
  }
  
  res.json({
    success: true,
    data: message
  });
});

// Update ticket status
app.patch('/api/tickets/:id/status', (req, res) => {
  const ticketId = req.params.id;
  const { status } = req.body;
  
  // In real app, this would update the database
  res.json({
    success: true,
    message: '티켓 상태가 업데이트되었습니다.',
    data: {
      id: ticketId,
      status: status,
      updatedAt: new Date().toISOString()
    }
  });
});

// Reassign ticket
app.patch('/api/tickets/:id/reassign', (req, res) => {
  const ticketId = req.params.id;
  const { assigneeId } = req.body;
  
  // In real app, this would update the database
  res.json({
    success: true,
    message: '티켓이 재할당되었습니다.',
    data: {
      id: ticketId,
      assigneeId: assigneeId,
      updatedAt: new Date().toISOString()
    }
  });
});

// KakaoTalk intake endpoint
app.post('/api/intake/kakaotalk', (req, res) => {
  const { sender, message, chatId } = req.body;
  console.log('KakaoTalk intake:', { sender, message, chatId });
  res.json({
    success: true,
    messageId: `kakaotalk_${Date.now()}`,
    classification: 'inquiry',
    priority: 'medium',
    estimatedResponse: '1-2 hours'
  });
});

// KakaoTalk response endpoint
app.post('/api/intake/kakaotalk/response', (req, res) => {
  const { chatId, message, messageType } = req.body;
  console.log('KakaoTalk response:', { chatId, message, messageType });
  res.json({
    success: true,
    message: 'KakaoTalk 메시지가 전송되었습니다.',
    timestamp: new Date().toISOString()
  });
});

// Get all intake messages
app.get('/api/intake/messages', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const messages = [
    {
      id: 'msg_001',
      channel: 'sms',
      content: '엘리베이터가 고장났어요',
      maskedContent: '엘리베이터가 고장났어요',
      sender: '010-1234-5678',
      maskedSender: '010-****-5678',
      classification: 'common_facility',
      priority: 'high',
      status: 'processed',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    },
    {
      id: 'msg_002',
      channel: 'web',
      content: '관리비 문의드립니다',
      maskedContent: '관리비 문의드립니다',
      sender: 'user@example.com',
      maskedSender: 'u***@example.com',
      classification: 'billing',
      priority: 'medium',
      status: 'assigned',
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
    },
    {
      id: 'msg_003',
      channel: 'email',
      content: '주차장 불법주차 신고',
      maskedContent: '주차장 불법주차 신고',
      sender: 'resident@apt.com',
      maskedSender: 'r*****@apt.com',
      classification: 'parking',
      priority: 'medium',
      status: 'pending',
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: messages.slice(0, limit),
    total: messages.length
  });
});

// Update message status
app.patch('/api/intake/messages/:id/status', (req, res) => {
  const messageId = req.params.id;
  const { status } = req.body;
  
  res.json({
    success: true,
    message: '메시지 상태가 업데이트되었습니다.',
    data: {
      id: messageId,
      status: status,
      updatedAt: new Date().toISOString()
    }
  });
});

// LLM status endpoint
app.get('/api/intake/llm/status', (req, res) => {
  res.json({
    success: true,
    data: {
      enabled: false,
      model: 'mistral-7b',
      status: 'offline',
      lastUpdate: new Date().toISOString()
    }
  });
});

// LLM toggle endpoint
app.post('/api/intake/llm/toggle', (req, res) => {
  const { enabled } = req.body;
  res.json({
    success: true,
    message: `LLM이 ${enabled ? '활성화' : '비활성화'}되었습니다.`,
    data: {
      enabled: enabled,
      updatedAt: new Date().toISOString()
    }
  });
});

// LLM test endpoint
app.post('/api/intake/llm/test', (req, res) => {
  const { message } = req.body;
  res.json({
    success: true,
    data: {
      classification: 'common_facility',
      confidence: 0.85,
      reasoning: '엘리베이터 관련 키워드가 감지되어 공용시설 문제로 분류했습니다.',
      processingTime: '1.2s'
    }
  });
});

// LLM apartment endpoint
app.post('/api/intake/llm/apartment', (req, res) => {
  const { message } = req.body;
  res.json({
    success: true,
    data: {
      apartmentUnit: {
        dong: '101',
        ho: '502',
        confidence: 0.9
      },
      extractedInfo: {
        location: '101동 502호',
        keywords: ['엘리베이터', '고장']
      }
    }
  });
});

// LLM keywords endpoint
app.post('/api/intake/llm/keywords', (req, res) => {
  const { messages } = req.body;
  res.json({
    success: true,
    data: {
      keywords: [
        { word: '엘리베이터', frequency: 15, category: 'common_facility' },
        { word: '관리비', frequency: 12, category: 'billing' },
        { word: '주차장', frequency: 8, category: 'parking' },
        { word: '소음', frequency: 6, category: 'noise' },
        { word: '청소', frequency: 4, category: 'hygiene' }
      ],
      totalMessages: messages ? messages.length : 0,
      processingTime: '2.1s'
    }
  });
});

// Tickets endpoint
app.get('/api/tickets', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const tickets = [
    {
      id: 'ticket_001',
      number: 'T-2025-001',
      title: '엘리베이터 고장 신고',
      status: 'assigned',
      priority: 'high',
      assignee: '김관리',
      assigneeId: 'staff_001',
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
      slaDeadline: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString()
    },
    {
      id: 'ticket_002',
      number: 'T-2025-002',
      title: '관리비 문의',
      status: 'pending',
      priority: 'medium',
      assignee: null,
      assigneeId: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
      slaDeadline: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString()
    },
    {
      id: 'ticket_003',
      number: 'T-2025-003',
      title: '주차장 불법주차',
      status: 'processed',
      priority: 'medium',
      assignee: '박경비',
      assigneeId: 'staff_002',
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      dueDate: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      slaDeadline: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: tickets.slice(0, limit)
  });
});

// Ticket detail page route
app.get('/ticket-detail', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ticket-detail.html'));
});

// Catch all handler for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AI Secretary server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard.html`);
  console.log(`🧪 Test API: http://localhost:${PORT}/test.html`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
});

module.exports = app;