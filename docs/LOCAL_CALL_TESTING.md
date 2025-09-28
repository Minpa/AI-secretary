# Local Call Testing with ngrok

## Quick Setup for Real Phone Testing

### 1. Start Your Local Server
```bash
npm run dev
# Server runs on http://localhost:3000
```

### 2. Expose with ngrok
```bash
ngrok http 3000
# Output will show:
# Forwarding: https://abc123.ngrok.io -> http://localhost:3000
```

### 3. Test Call Endpoint
```bash
# Test your exposed endpoint
curl -X POST https://abc123.ngrok.io/api/intake/call \
  -H "Content-Type: application/json" \
  -d '{
    "caller": "+821012345678",
    "transcript": "안녕하세요, 101동 1502호입니다. 화장실 변기가 막혔어요.",
    "duration": 45
  }'
```

## Real Phone Integration

### Option A: Twilio (Recommended)
1. Sign up at [twilio.com](https://twilio.com) - $15 free credit
2. Buy a Korean phone number (~$1/month)
3. Set webhook URL to: `https://abc123.ngrok.io/api/intake/twilio-call`
4. Call the Twilio number and speak in Korean
5. Twilio will transcribe and send to your local server

### Option B: Voice Recording Test
1. Visit: `https://abc123.ngrok.io/test.html`
2. Use the "🎤 음성 녹음 시작" button
3. Speak in Korean
4. Test the call processing

## Testing Scenarios

### Test Cases
```bash
# Maintenance Request
curl -X POST https://abc123.ngrok.io/api/intake/call \
  -H "Content-Type: application/json" \
  -d '{
    "caller": "+821012345678",
    "transcript": "화장실 변기가 막혔어요",
    "duration": 30
  }'

# Noise Complaint  
curl -X POST https://abc123.ngrok.io/api/intake/call \
  -H "Content-Type: application/json" \
  -d '{
    "caller": "+821087654321",
    "transcript": "위층에서 너무 시끄러워요",
    "duration": 45
  }'

# Facility Issue
curl -X POST https://abc123.ngrok.io/api/intake/call \
  -H "Content-Type: application/json" \
  -d '{
    "caller": "+821055555555",
    "transcript": "엘리베이터가 고장났어요",
    "duration": 25
  }'
```

## Verification Steps

### 1. Check Call Processing
- Visit: `https://abc123.ngrok.io/dashboard.html`
- Verify call appears in recent messages
- Check classification results

### 2. Check Database
```bash
# In your local terminal
npm run db:seed  # If needed
# Check messages table for new call entries
```

### 3. Test Korean Response
- For Twilio integration, you should hear Korean response
- "접수되었습니다. 빠른 시일 내에 연락드리겠습니다."

## Troubleshooting

### ngrok Issues
- **Tunnel not found**: Restart ngrok
- **Connection refused**: Ensure local server is running on port 3000
- **Webhook timeout**: Check server logs for errors

### Twilio Issues
- **No transcription**: Ensure Korean language is enabled
- **Webhook fails**: Check ngrok URL is correct
- **No response**: Verify TwiML response format

### Local Server Issues
```bash
# Check server is running
curl http://localhost:3000/health

# Check call endpoint
curl -X POST http://localhost:3000/api/intake/call \
  -H "Content-Type: application/json" \
  -d '{"caller":"+821012345678","transcript":"테스트"}'
```

## Cost Estimate

### Free Testing
- **ngrok**: Free tier (8 hours/month)
- **Voice recording**: Free browser feature
- **Manual API testing**: Free

### Paid Testing
- **Twilio**: $15 free credit (covers ~100 calls)
- **Korean phone number**: ~$1/month
- **Call costs**: ~$0.01/minute

## Security Notes

### ngrok Security
- **Temporary URLs**: ngrok URLs change on restart
- **Public access**: Anyone with URL can access your server
- **Development only**: Don't use for production

### Production Alternative
- Deploy to Railway for permanent testing
- Use proper domain and SSL certificates
- Implement webhook signature validation