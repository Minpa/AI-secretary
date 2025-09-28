# Call Testing Guide

## Method 1: Twilio Integration (Recommended)

### Setup Twilio Account
1. Sign up at [twilio.com](https://twilio.com) (free trial gives you $15 credit)
2. Buy a phone number (~$1/month)
3. Set up call recording and transcription

### Configure Twilio Webhook
In your Twilio console, set the webhook URL to:
```
https://your-app.railway.app/api/intake/twilio-call
```

### Add Twilio Webhook Handler
Add this to your intake controller:

```typescript
handleTwilioCall = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { From, TranscriptionText, CallDuration, CallSid } = req.body;
    
    if (!From || !TranscriptionText) {
      throw new AppError('Missing required Twilio fields', 400);
    }

    const message = await this.intakeService.processMessage({
      channel: IntakeChannel.CALL,
      content: TranscriptionText,
      sender: From,
      metadata: {
        callSid: CallSid,
        duration: CallDuration
      }
    });

    // Respond to Twilio with TwiML
    res.set('Content-Type', 'text/xml');
    res.send(`
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="alice" language="ko-KR">
          접수되었습니다. 빠른 시일 내에 연락드리겠습니다.
        </Say>
        <Hangup/>
      </Response>
    `);
  } catch (error) {
    next(error);
  }
};
```

## Method 2: Manual API Testing

### Test Call Endpoint Directly
```bash
curl -X POST https://your-app.railway.app/api/intake/call \
  -H "Content-Type: application/json" \
  -d '{
    "caller": "+821012345678",
    "transcript": "안녕하세요, 101동 1502호입니다. 화장실 변기가 막혔어요.",
    "duration": 45
  }'
```

### Test via Web Interface
Visit: `https://your-app.railway.app/test.html`
- Use the "Call Log" section
- Enter Korean transcript
- Test the API response

## Method 3: Voice Recording Integration

### Using Browser Speech Recognition
Add this to your test.html:

```javascript
// Add speech recognition for call testing
if ('webkitSpeechRecognition' in window) {
  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'ko-KR';
  recognition.continuous = false;
  
  document.getElementById('startRecording').onclick = () => {
    recognition.start();
  };
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById('callTranscript').value = transcript;
  };
}
```

## Method 4: Phone System Integration

### For Production Use
1. **VoIP Integration**: Connect with Korean VoIP providers
2. **PBX Systems**: Integrate with existing apartment PBX
3. **Call Center Software**: Use existing call center transcription

### Korean VoIP Providers
- **KT**: Enterprise VoIP with API
- **LG U+**: Business phone services
- **SK Telecom**: Corporate solutions

## Testing Scenarios

### Test Cases to Try
1. **Maintenance Request**: "화장실 변기가 막혔어요"
2. **Noise Complaint**: "위층에서 너무 시끄러워요"
3. **Facility Issue**: "엘리베이터가 고장났어요"
4. **General Inquiry**: "관리비 문의드립니다"

### Expected Results
- Call transcript processed
- Automatic classification
- Ticket creation
- Korean response

## Cost Estimates

### Twilio Pricing (USD)
- **Phone Number**: $1/month
- **Incoming Calls**: $0.0085/minute
- **Transcription**: $0.05/minute
- **100 calls/month**: ~$10-15

### Korean Alternatives
- **NHN Toast**: More cost-effective for Korea
- **Aligo**: Local SMS/Call provider
- **KakaoTalk Business**: Integration option

## Production Deployment

### Environment Variables
```bash
# Add to Railway
railway variables set TWILIO_ACCOUNT_SID=your_sid
railway variables set TWILIO_AUTH_TOKEN=your_token
railway variables set TWILIO_PHONE_NUMBER=+821234567890
```

### Security
- Validate Twilio signatures
- Rate limiting for call endpoints
- PII masking for call transcripts

## Troubleshooting

### Common Issues
1. **No Transcription**: Check Twilio transcription settings
2. **Korean Not Recognized**: Ensure `lang="ko-KR"` in TwiML
3. **Webhook Failures**: Check Railway logs
4. **CORS Issues**: Add Twilio IPs to allowlist

### Testing Commands
```bash
# Check call endpoint health
curl https://your-app.railway.app/api/health

# Test call processing
curl -X POST https://your-app.railway.app/api/intake/call \
  -H "Content-Type: application/json" \
  -d '{"caller":"+821012345678","transcript":"테스트 통화입니다"}'
```