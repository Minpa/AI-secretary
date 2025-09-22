# LLM Integration Setup Guide

This guide explains how to set up and use the local Mistral-7B model integration for message classification.

## Prerequisites

### 1. Install Ollama

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
Download from https://ollama.ai/download

### 2. Start Ollama Service

```bash
ollama serve
```

The service will run on `http://localhost:11434` by default.

### 3. Install Mistral-7B Model

```bash
ollama pull mistral:7b
```

This will download the ~4GB Mistral-7B model.

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Enable LLM classification fallback
LLM_ENABLED=true

# Ollama configuration (optional, defaults shown)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral:7b
```

### Development vs Production

- **Development**: LLM is disabled by default for faster testing
- **Production**: Set `LLM_ENABLED=true` to enable LLM fallback
- **Test**: LLM is always disabled in test environment

## How It Works

### Classification Flow

1. **Rule-based Classification First**: Uses Korean keyword matching
2. **Confidence Check**: If confidence < 70%, proceed to LLM
3. **LLM Fallback**: Calls local Mistral-7B for classification
4. **Best Result**: Uses the classification with higher confidence

### Message Categories

The LLM classifies messages into these categories:

- `NOISE`: 소음 관련 (층간소음, 시끄러운 소리 등)
- `PARKING`: 주차 관련 (주차 위반, 주차장 문제 등)  
- `MAINTENANCE`: 시설 수리/관리 (고장, 수리 요청 등)
- `BILLING`: 관리비/요금 관련
- `SECURITY`: 보안/출입 관련
- `EMERGENCY`: 응급상황 (화재, 가스누출 등)
- `INQUIRY`: 일반 문의

## Usage

### 1. Web Interface Control

Visit `http://localhost:3000/test` to:

- **View LLM Status**: Check if Ollama is running and model is available
- **Toggle LLM**: Enable/disable LLM classification
- **Test Classification**: Try classifying sample messages
- **Monitor Performance**: See classification results and confidence scores

### 2. API Endpoints

#### Get LLM Status
```bash
GET /api/intake/llm/status
```

#### Toggle LLM On/Off
```bash
POST /api/intake/llm/toggle
Content-Type: application/json

{
  "enabled": true
}
```

#### Test LLM Classification
```bash
POST /api/intake/llm/test
Content-Type: application/json

{
  "text": "윗집에서 너무 시끄러워요"
}
```

### 3. Programmatic Control

```typescript
import { llmService } from '@/shared/services/llm.service';

// Check if LLM is available
const available = await llmService.isAvailable();

// Enable/disable LLM
llmService.setEnabled(true);

// Classify a message
const result = await llmService.classifyMessage("소음 문의 내용");
```

## Performance Considerations

### Resource Usage

- **Memory**: Mistral-7B requires ~8GB RAM
- **CPU**: Classification takes 1-3 seconds on modern hardware
- **Disk**: Model file is ~4GB

### Optimization Settings

The LLM service is configured for:

- **Low Temperature (0.1)**: Consistent, deterministic results
- **Limited Tokens (200)**: Fast responses
- **Timeout (30s)**: Prevents hanging requests
- **Retry Logic**: 2 retries with exponential backoff

### Fallback Strategy

If LLM fails:
1. Uses rule-based classification result
2. Logs warning but continues processing
3. No impact on system availability

## Troubleshooting

### Common Issues

#### 1. "LLM service not available"
- Check if Ollama is running: `curl http://localhost:11434/api/tags`
- Verify model is installed: `ollama list`
- Check firewall/network settings

#### 2. "Model not found"
- Install the model: `ollama pull mistral:7b`
- Check model name matches config: `mistral:7b`

#### 3. Slow responses
- Ensure sufficient RAM (8GB+)
- Check CPU usage during classification
- Consider using smaller model for development

#### 4. High memory usage
- Ollama keeps model in memory after first use
- Restart Ollama to free memory: `ollama serve`
- Monitor with: `ollama ps`

### Debug Mode

Enable detailed logging:

```bash
export LOG_LEVEL=debug
npm run dev
```

This will show:
- LLM availability checks
- Classification attempts and results
- Performance metrics
- Error details

## Security Considerations

### Privacy

- **Local Processing**: All LLM processing happens locally
- **No External Calls**: No data sent to external services
- **PII Masking**: Personal information is masked before LLM processing

### Network Security

- **Local Only**: Ollama runs on localhost by default
- **No Authentication**: Ollama has no built-in auth (local use only)
- **Firewall**: Consider blocking external access to port 11434

## Monitoring

### Metrics to Watch

- **Classification Accuracy**: Compare LLM vs rule-based results
- **Response Times**: Monitor LLM classification latency
- **Fallback Rate**: How often LLM is used vs rules
- **Error Rate**: Failed LLM calls

### Logs

Key log messages:
- `Using LLM fallback for low-confidence classification`
- `LLM classification failed, using rule-based result`
- `LLM service toggled`

## Production Deployment

### Recommended Setup

1. **Dedicated Server**: Run Ollama on separate server if possible
2. **Resource Allocation**: Ensure 8GB+ RAM for model
3. **Monitoring**: Set up alerts for LLM service health
4. **Backup Strategy**: Keep rule-based classification as fallback

### Environment Configuration

```bash
# Production settings
LLM_ENABLED=true
OLLAMA_BASE_URL=http://llm-server:11434
OLLAMA_MODEL=mistral:7b

# Optional: Custom timeout for production
LLM_TIMEOUT=45000
```

### Health Checks

Add to your monitoring:

```bash
# Check Ollama health
curl -f http://localhost:11434/api/tags || exit 1

# Check model availability
curl -s http://localhost:11434/api/tags | grep -q "mistral" || exit 1
```

## Future Enhancements

### Planned Features

- **Model Fine-tuning**: Train on apartment-specific data
- **Multiple Models**: Support different models for different tasks
- **Batch Processing**: Classify multiple messages at once
- **Performance Metrics**: Built-in accuracy tracking
- **Auto-scaling**: Dynamic model loading based on demand

### Alternative Models

Consider these models for different use cases:

- **Smaller/Faster**: `mistral:7b-instruct-q4_0` (quantized)
- **Korean-optimized**: `kullm:13b` (if available)
- **Larger/More Accurate**: `mistral:7b-instruct` (full precision)

## Support

For issues with:
- **Ollama**: Check https://ollama.ai/docs
- **Mistral Model**: See https://mistral.ai/docs
- **Integration**: Check application logs and this documentation