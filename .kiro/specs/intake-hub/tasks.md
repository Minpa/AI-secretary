# Implementation Plan

- [ ] 1. Set up project structure and core interfaces
  - Create Express.js application with TypeScript configuration
  - Set up database connection utilities with PostgreSQL
  - Define core TypeScript interfaces for intake messages and events
  - Configure environment variables and validation
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Implement database schema and models
  - Create PostgreSQL migration files for all intake tables
  - Implement database models with proper relationships
  - Add database connection pooling and error handling
  - Write unit tests for database operations
  - _Requirements: 7.1, 7.2_

- [ ] 3. Create PII masking service
  - Implement regex patterns for phone, email, and unit number detection
  - Create token generation and mapping functionality
  - Add secure storage for PII token mappings
  - Write comprehensive unit tests for all PII patterns
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 4. Build HMAC validation middleware
  - Implement HMAC-SHA256 signature verification for SMS webhooks
  - Create middleware for validating provider signatures
  - Add provider secret management and rotation
  - Write security tests for signature validation
  - _Requirements: 5.1, 5.2, 5.4_

- [ ] 5. Implement SMS webhook endpoint
  - Create POST /intake/sms endpoint with HMAC validation
  - Parse SMS provider webhook payload format
  - Store raw message data and generate message hash for deduplication
  - Add error handling and audit logging
  - _Requirements: 1.1, 5.1, 5.2, 7.1_

- [ ] 6. Implement email ingestion endpoint
  - Create POST /intake/email endpoint for email processing
  - Parse email headers, body, and attachments
  - Handle multipart MIME content and file uploads
  - Store email data with proper normalization
  - _Requirements: 1.2, 7.1_

- [ ] 7. Create web form submission endpoint
  - Implement POST /intake/web with CAPTCHA validation
  - Add form validation and sanitization
  - Support both authenticated and anonymous submissions
  - Include rate limiting and spam protection
  - _Requirements: 1.3, 5.3, 4.3_

- [ ] 8. Build call log API endpoint
  - Create POST /intake/call for staff-initiated entries
  - Add authentication and authorization middleware
  - Implement one-click ticket creation functionality
  - Add audit logging for staff actions
  - _Requirements: 1.4, 7.3_

- [ ] 9. Implement classification rules engine
  - Create rule-based urgent keyword detection system
  - Implement category synonym mapping and normalization
  - Add configurable rule sets with admin update capability
  - Write unit tests for all classification rules
  - _Requirements: 3.2, 3.4, 7.3_

- [ ] 10. Integrate LLM classification service
  - Create LLM gateway client with timeout and retry logic
  - Implement structured JSON schema validation for LLM responses
  - Add fallback mechanism when LLM classification fails
  - Create unit tests with mocked LLM responses
  - _Requirements: 3.1, 3.3, 3.4_

- [ ] 11. Build deduplication and spam filtering
  - Implement Redis-based sliding window for duplicate detection
  - Create spam detection rules and rate limiting logic
  - Add configurable time windows and thresholds
  - Write tests for various deduplication scenarios
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 12. Create event publishing system
  - Implement IntakeCreated event structure and validation
  - Add event queue integration with proper error handling
  - Create event publishing with retry and backoff logic
  - Write integration tests for event delivery
  - _Requirements: 6.1, 6.3, 6.4_

- [ ] 13. Implement intake retrieval API
  - Create GET /intake/{id} endpoint with proper authorization
  - Add filtering and pagination for intake queries
  - Implement proper data serialization and response formatting
  - Add caching layer for frequently accessed intakes
  - _Requirements: 7.1_

- [ ] 14. Add comprehensive error handling
  - Implement global error handler with proper HTTP status codes
  - Add structured logging with correlation IDs
  - Create audit logging for all security-related events
  - Add monitoring metrics for error rates and response times
  - _Requirements: 5.4, 7.1, 7.4_

- [ ] 15. Create attachment handling system
  - Implement file upload validation and virus scanning
  - Add S3-compatible storage integration for attachments
  - Create secure file access with signed URLs
  - Write tests for various file types and sizes
  - _Requirements: 1.2_

- [ ] 16. Build processing orchestration
  - Create main processing pipeline that coordinates all services
  - Implement transaction management for multi-step operations
  - Add processing status tracking and recovery mechanisms
  - Write end-to-end integration tests for complete flow
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.2_

- [ ] 17. Add monitoring and observability
  - Implement Prometheus metrics for throughput and latency
  - Add structured logging with proper log levels
  - Create health check endpoints for service monitoring
  - Add performance monitoring for SLA compliance
  - _Requirements: 7.4_

- [ ] 18. Create configuration management
  - Implement environment-based configuration loading
  - Add configuration validation and default values
  - Create admin interface for updating classification rules
  - Add configuration change audit logging
  - _Requirements: 7.3_

- [ ] 19. Write comprehensive test suite
  - Create unit tests for all service components
  - Implement integration tests for API endpoints
  - Add performance tests to validate SLA requirements
  - Create security tests for authentication and authorization
  - _Requirements: 1.1, 5.1, 7.4_

- [ ] 20. Add deployment and documentation
  - Create Docker configuration and deployment scripts
  - Write API documentation with OpenAPI specification
  - Add operational runbooks and troubleshooting guides
  - Create database migration and rollback procedures
  - _Requirements: 7.1, 7.4_