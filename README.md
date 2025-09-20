# AI Secretary for Apartment Complex Operations

A vendor-neutral operations management system designed for apartment complexes in Korea. The system preserves operational memory across vendor changes while improving response times and reducing manual workload for property managers.

## Features

- **Multi-channel Intake**: SMS, email, web forms, and call logs
- **Privacy-First**: PII masking before any LLM processing
- **SLA Management**: Automated ticket lifecycle with SLA tracking
- **Operations Memory**: Anonymous aggregated operational history
- **Risk Forecasting**: Rule-based risk analysis and action calendars
- **Korean Localization**: Optimized for Korean apartment complex workflows

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 6+
- Docker (optional)

### Development Setup

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/yourusername/ai-secretary.git
   cd ai-secretary
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start services with Docker**
   ```bash
   docker compose up -d postgres redis minio ollama
   ```

4. **Run database migrations** (when implemented)
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Test Page: http://localhost:3000/test
   - Dashboard: http://localhost:3000/dashboard
   - API Health: http://localhost:3000/health

The API will be available at `http://localhost:3000`

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm run test:unit
npm run test:integration
```

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## API Documentation

### Health Check
- `GET /health` - System health status

### Intake Hub
- `POST /api/intake/sms` - Process SMS messages
- `POST /api/intake/email` - Process email messages
- `POST /api/intake/web` - Process web form submissions
- `POST /api/intake/call` - Process call transcripts

### Ticketing
- `GET /api/tickets` - List tickets
- `POST /api/tickets` - Create ticket
- `PATCH /api/tickets/:id/assign` - Assign ticket
- `GET /api/tickets/sla/dashboard` - SLA dashboard

### Reports
- `POST /api/reports/generate` - Generate reports
- `GET /api/reports/:id/download` - Download report

## Architecture

The system follows a modular architecture with clear separation of concerns:

- **Intake Hub**: Multi-channel message processing with PII masking
- **Ticketing**: Lightweight ticket management with SLA tracking
- **Ops Memory**: Historical data aggregation and analytics
- **Reports**: PDF generation with Korean font support
- **ERP Reader**: CSV file ingestion from accounting systems
- **Risk Brief**: Rule-based forecasting and risk analysis
- **Admin**: Authentication, user management, and system settings

## Contributing

1. Follow the existing code style and conventions
2. Write tests for new features
3. Ensure all tests pass before submitting
4. Update documentation as needed

## License

MIT License