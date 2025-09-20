# Design Document

## Overview

The Intake Hub is designed as a microservice that handles multi-channel message ingestion with real-time processing capabilities. It follows an event-driven architecture with clear separation between ingestion, processing, and classification layers. The system prioritizes security through PII masking, performance through async processing, and reliability through comprehensive error handling and audit logging.

## Architecture

### High-Level Architecture

```mermaid
graph TB
    SMS[SMS Provider] --> |HMAC Webhook| IH[Intake Hub]
    EMAIL[Email Provider] --> |Webhook/IMAP| IH
    WEB[Web Form] --> |HTTPS| IH
    CALL[Call Log UI] --> |API| IH
    
    IH --> |PII Masking| MASK[Masking Service]
    MASK --> |Rules Engine| RULES[Classification Rules]
    RULES --> |Small LLM| LLM[LLM Gateway]
    LLM --> |Events| QUEUE[Event Queue]
    
    IH --> DB[(PostgreSQL)]
    IH --> REDIS[(Redis Cache)]
    QUEUE --> |IntakeCreated| TICKET[Ticketing System]
```

### Processing Pipeline

1. **Ingestion Layer**: Receives messages from multiple channels with appropriate validation
2. **Normalization Layer**: Extracts and normalizes message content and metadata
3. **Privacy Layer**: Masks PII and creates secure tokens
4. **Classification Layer**: Applies rules and LLM processing for categorization
5. **Event Layer**: Emits structured events for downstream processing

## Components and Interfaces

### Core Components

#### 1. Message Ingestion Service
- **Purpose**: Handle incoming messages from all channels
- **Responsibilities**: 
  - Validate HMAC signatures for SMS
  - Parse email content and attachments
  - Validate web form submissions with CAPTCHA
  - Provide API for call log entries
- **Technology**: Express.js with channel-specific middleware

#### 2. PII Masking Service
- **Purpose**: Protect resident privacy by masking sensitive information
- **Responsibilities**:
  - Detect phone numbers, emails, and unit numbers using regex
  - Generate consistent tokens for the same PII values
  - Store mapping between tokens and original values securely
- **Technology**: Dedicated service with encrypted token storage

#### 3. Classification Engine
- **Purpose**: Categorize and prioritize incoming messages
- **Responsibilities**:
  - Apply rule-based urgent keyword detection
  - Interface with small LLM for category classification
  - Generate Korean summaries and evidence
  - Handle fallback scenarios
- **Technology**: Rule engine + LLM gateway integration

#### 4. Deduplication Service
- **Purpose**: Prevent duplicate tickets and filter spam
- **Responsibilities**:
  - Track recent messages by unit and category
  - Detect spam patterns and rate limiting violations
  - Maintain sliding window for duplicate detection
- **Technology**: Redis-based caching with TTL

### API Endpoints

```typescript
// SMS Webhook
POST /intake/sms
Headers: X-Signature (HMAC-SHA256)
Body: { from: string, body: string, messageId: string, timestamp: string }

// Email Webhook/Processing
POST /intake/email
Body: { from: string, subject: string, body: string, attachments?: File[] }

// Web Form Submission
POST /intake/web
Body: { message: string, contact?: string, captcha: string, anonymous: boolean }

// Call Log Entry
POST /intake/call
Body: { summary: string, caller_info?: string, staff_id: string }

// Retrieve Intake
GET /intake/{id}
Response: { id, channel, status, category, urgent, summary, created_at }
```

## Data Models

### Database Schema

```sql
-- Core intake message storage
CREATE TABLE intake_message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel VARCHAR(20) NOT NULL, -- 'sms', 'email', 'web', 'call'
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    provider_msg_id VARCHAR(255),
    message_id_hash VARCHAR(64) UNIQUE, -- For deduplication
    raw_payload JSONB NOT NULL,
    raw_text TEXT NOT NULL,
    remote_addr INET,
    signature_valid BOOLEAN,
    status VARCHAR(20) DEFAULT 'received'
);

-- Normalized and masked content
CREATE TABLE intake_normalized (
    intake_id UUID PRIMARY KEY REFERENCES intake_message(id),
    text_clean TEXT NOT NULL,
    text_masked TEXT NOT NULL,
    phone_token VARCHAR(50),
    email_token VARCHAR(50),
    unit_token VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classification results
CREATE TABLE intake_classification (
    intake_id UUID PRIMARY KEY REFERENCES intake_message(id),
    category VARCHAR(50) NOT NULL,
    urgent INTEGER NOT NULL CHECK (urgent IN (0, 1)),
    summary TEXT NOT NULL,
    evidence TEXT NOT NULL,
    score DECIMAL(3,2),
    model_version VARCHAR(50),
    source VARCHAR(20) NOT NULL, -- 'rules', 'llm', 'fallback'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File attachments
CREATE TABLE intake_attachment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_id UUID NOT NULL REFERENCES intake_message(id),
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes INTEGER NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Provider configuration
CREATE TABLE provider_secret (
    provider VARCHAR(50) PRIMARY KEY,
    hmac_secret TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Event Schema

```typescript
interface IntakeCreatedEvent {
  intake_id: string;
  channel: 'sms' | 'email' | 'web' | 'call';
  received_at: string; // ISO timestamp
  category: string;
  urgent: boolean;
  summary: string;
  resident_contact_token?: string;
}
```

## Error Handling

### Error Categories and Responses

1. **Validation Errors (400)**
   - Invalid HMAC signature
   - Missing required fields
   - Invalid CAPTCHA
   - Malformed request body

2. **Authentication Errors (401)**
   - Invalid or missing HMAC signature
   - Expired tokens

3. **Rate Limiting (429)**
   - Sender rate limit exceeded
   - System overload protection

4. **Processing Errors (500)**
   - LLM gateway failures
   - Database connection issues
   - File storage problems

### Retry and Fallback Strategy

- **LLM Classification**: Single retry on invalid JSON, fallback to rule-based classification
- **Event Publishing**: Exponential backoff with 3 retries
- **File Storage**: Retry with different storage endpoint
- **Database Operations**: Connection pooling with automatic retry

## Testing Strategy

### Unit Testing
- **PII Masking**: Test regex patterns with various phone/email/unit formats
- **Classification Rules**: Verify urgent keyword detection and category mapping
- **Deduplication Logic**: Test sliding window and hash generation
- **HMAC Validation**: Test signature verification with known test vectors

### Integration Testing
- **End-to-End Channel Testing**: SMS webhook → classification → event emission
- **LLM Gateway Integration**: Mock LLM responses and test fallback scenarios
- **Database Transactions**: Test rollback scenarios and data consistency
- **Event Publishing**: Verify event format and delivery

### Performance Testing
- **Throughput**: Target 100 messages/second sustained load
- **Latency**: p95 ≤ 3 seconds for intake-to-ticket processing
- **Memory Usage**: Monitor for memory leaks during extended operation
- **Database Performance**: Query optimization and connection pooling

### Security Testing
- **HMAC Validation**: Test with invalid signatures and replay attacks
- **PII Masking**: Verify no PII leakage in logs or responses
- **Input Validation**: SQL injection and XSS prevention
- **Rate Limiting**: Test abuse scenarios and proper blocking

## Configuration and Deployment

### Environment Configuration
```yaml
# Application settings
PORT: 3000
NODE_ENV: production

# Database
DATABASE_URL: postgresql://user:pass@host:5432/intake_hub
REDIS_URL: redis://host:6379

# External services
LLM_GATEWAY_URL: http://ollama:11434
SMS_WEBHOOK_SECRET: ${SMS_HMAC_SECRET}
STORAGE_ENDPOINT: s3://bucket-name

# Feature flags
ENABLE_DEDUPLICATION: true
ENABLE_SPAM_FILTERING: true
LLM_TIMEOUT_MS: 5000
```

### Monitoring and Observability
- **Metrics**: Message throughput, processing latency, error rates
- **Logging**: Structured JSON logs with correlation IDs
- **Alerts**: SLA violations, high error rates, LLM gateway failures
- **Dashboards**: Real-time intake volume, category distribution, urgent message trends