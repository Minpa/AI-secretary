# Project Structure & Organization

## Root Directory Layout

```
├── src/                    # Source code
│   ├── modules/           # Feature modules (intake-hub, ticketing, etc.)
│   ├── shared/            # Shared utilities and types
│   ├── config/            # Configuration management
│   └── app.ts             # Application entry point
├── tests/                 # Test files
├── migrations/            # Database migrations
├── docs/                  # Documentation
├── docker/                # Docker configurations
└── scripts/               # Build and deployment scripts
```

## Module Organization

Each module follows a consistent structure:

```
src/modules/{module-name}/
├── controllers/           # HTTP request handlers
├── services/             # Business logic
├── models/               # Database models and schemas
├── middleware/           # Module-specific middleware
├── types/                # TypeScript interfaces
├── routes/               # Route definitions
├── tests/                # Module-specific tests
└── index.ts              # Module exports
```

## Key Modules

### 1. Intake Hub (`src/modules/intake-hub/`)
- Multi-channel message ingestion (SMS, email, web, call)
- PII masking and normalization
- Classification engine (rules + LLM)
- Deduplication and spam filtering

### 2. Ticketing (`src/modules/ticketing/`)
- Ticket lifecycle management
- SLA tracking and notifications
- Assignment and routing logic
- Status transitions and audit trails

### 3. Ops Memory (`src/modules/ops-memory/`)
- Daily/monthly aggregation jobs
- K-anonymity filtering
- Historical data exports
- Privacy-compliant analytics

### 4. Reports (`src/modules/reports/`)
- PDF generation with Korean fonts
- CSV bundle creation
- Scheduled report generation
- Template management

### 5. ERP Reader (`src/modules/erp-reader/`)
- CSV file ingestion and validation
- Schema mapping and transformation
- Idempotency and error handling
- Read-only ERP integration

### 6. Risk Brief (`src/modules/risk-brief/`)
- Rule-based risk scoring
- Seasonal pattern detection
- Action calendar generation
- Forecasting algorithms

### 7. Admin (`src/modules/admin/`)
- Authentication (email + OTP)
- RBAC and permissions
- System settings management
- Audit logging and monitoring

## Shared Components

### `src/shared/`
```
├── database/             # Database connection and utilities
├── events/               # Event system and queue management
├── security/             # Authentication and authorization
├── validation/           # Input validation schemas
├── utils/                # Common utilities
├── types/                # Global TypeScript types
└── constants/            # Application constants
```

## Configuration Structure

### Environment-based Configuration
- `config/development.ts` - Development settings
- `config/production.ts` - Production settings
- `config/test.ts` - Test environment settings
- `config/index.ts` - Configuration loader

### Database Migrations
- Sequential numbered migrations: `001_initial_schema.sql`
- Rollback scripts: `001_initial_schema_down.sql`
- Seed data: `seeds/` directory

## Testing Organization

```
tests/
├── unit/                 # Unit tests (mirror src structure)
├── integration/          # API integration tests
├── e2e/                  # End-to-end tests
├── fixtures/             # Test data and mocks
└── helpers/              # Test utilities
```

## File Naming Conventions

- **Controllers**: `{entity}.controller.ts` (e.g., `intake.controller.ts`)
- **Services**: `{entity}.service.ts` (e.g., `classification.service.ts`)
- **Models**: `{entity}.model.ts` (e.g., `intake-message.model.ts`)
- **Types**: `{entity}.types.ts` (e.g., `intake.types.ts`)
- **Tests**: `{entity}.test.ts` or `{entity}.spec.ts`
- **Migrations**: `{timestamp}_{description}.sql`

## Import Path Conventions

Use absolute imports with path mapping:
```typescript
// Good
import { IntakeService } from '@/modules/intake-hub/services/intake.service';
import { DatabaseConfig } from '@/shared/database/config';

// Avoid
import { IntakeService } from '../../../modules/intake-hub/services/intake.service';
```

## Code Organization Principles

1. **Separation of Concerns**: Each module handles a specific domain
2. **Dependency Injection**: Services are injected, not imported directly
3. **Interface Segregation**: Small, focused interfaces over large ones
4. **Single Responsibility**: Each file/class has one clear purpose
5. **Privacy by Design**: PII handling isolated in dedicated services

## Documentation Standards

- **README.md**: Module overview and setup instructions
- **API.md**: Endpoint documentation with examples
- **ARCHITECTURE.md**: High-level design decisions
- **DEPLOYMENT.md**: Production deployment guide
- **TROUBLESHOOTING.md**: Common issues and solutions