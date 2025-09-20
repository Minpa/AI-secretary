# Technology Stack & Build System

## Core Technologies

### Backend Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST APIs
- **Database**: PostgreSQL 15+ (primary), Redis 6+ (caching/sessions)
- **Storage**: S3-compatible object storage (MinIO for dev, AWS S3 for prod)
- **Queue**: Event-driven architecture with Redis-based queuing

### AI/ML Integration
- **LLM Gateway**: Ollama for local small LLM inference (Mistral-7B recommended)
- **Classification**: Hybrid rule-based + small LLM approach
- **Privacy**: PII masking before any LLM processing

### External Integrations
- **SMS**: Twilio (dev), NHN Toast or Aligo (prod)
- **Email**: IMAP/SMTP relay, AWS SES/SendGrid for outbound
- **PDF Generation**: Playwright/Chromium with embedded Noto Sans KR fonts

### Infrastructure
- **Containerization**: Docker with Kubernetes compatibility
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus metrics, structured JSON logging
- **Security**: HMAC webhook validation, email+OTP auth, RBAC

## Development Commands

### Setup
```bash
# Install dependencies
npm install

# Database setup
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

### Testing
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

### Database Operations
```bash
# Create new migration
npm run db:migration:create <name>

# Run migrations
npm run db:migrate

# Rollback migration
npm run db:rollback

# Reset database (dev only)
npm run db:reset
```

### Build & Deployment
```bash
# Build for production
npm run build

# Start production server
npm start

# Docker build
docker build -t ai-secretary .

# Docker compose (dev environment)
docker-compose up -d
```

## Code Quality Standards
- **TypeScript**: Strict mode enabled, no `any` types
- **Linting**: ESLint with Prettier for consistent formatting
- **Testing**: Jest for unit tests, Supertest for API integration tests
- **Coverage**: Minimum 80% code coverage required
- **Security**: Regular dependency audits, OWASP compliance

## Performance Requirements
- **Intake Processing**: p95 ≤ 3 seconds from intake to ticket creation
- **API Response**: p95 ≤ 500ms for standard endpoints
- **Notification Dispatch**: p95 ≤ 60 seconds
- **PDF Generation**: p95 ≤ 30 seconds
- **System Availability**: ≥99.5% monthly uptime