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
    totalMessages: 42,
    activeTickets: 8,
    slaCompliance: 95.2,
    riskScore: 23
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