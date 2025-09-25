# Implementation Plan

- [x] 1. Create backend analytics service and API endpoints
  - Implement database queries for unit analytics aggregation
  - Create API endpoints for unit statistics, history, and export
  - Add proper error handling and validation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 1.1 Create unit analytics service
  - Write service class for apartment unit data aggregation
  - Implement methods for top units query with filtering
  - Add unit metrics calculation (total units, averages, peak periods)
  - Create building-level grouping functionality
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.3, 4.4_

- [x] 1.2 Implement unit analytics API endpoint
  - Create GET /api/reports/units/analytics endpoint
  - Add query parameter validation for date range and categories
  - Implement response formatting with top units and metrics
  - Add proper error handling for database failures
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 1.3 Create unit history API endpoint
  - Implement GET /api/reports/units/:dong/:ho/history endpoint
  - Add pagination support for large request histories
  - Include proper content masking for privacy
  - Add filtering by date range and categories
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 1.4 Implement CSV export functionality
  - Create GET /api/reports/units/export endpoint
  - Generate CSV with unit analytics data
  - Ensure privacy compliance in exported data
  - Add proper file download headers and error handling
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3_

- [x] 2. Add unit analytics section to reports page frontend
  - Create React components for unit analytics display
  - Implement top units table with sorting and interaction
  - Add integration with existing report filters
  - Create loading states and error handling
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2.1 Create UnitAnalyticsSection component
  - Build top units table with ranking and metrics
  - Add click handlers for unit selection
  - Implement responsive design for mobile devices
  - Add loading skeleton and empty states
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2.2 Integrate with existing report filters
  - Connect unit analytics to date range filters
  - Add category filter integration
  - Implement real-time updates when filters change
  - Ensure filter state persistence across page interactions
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2.3 Add unit metrics display component
  - Create summary metrics section (total units, averages)
  - Display most active building and peak periods
  - Add visual indicators for key metrics
  - Implement responsive layout for different screen sizes
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3. Create unit history modal with detailed view
  - Build modal component for unit request history
  - Implement pagination for large datasets
  - Add request timeline with proper formatting
  - Create export functionality for individual units
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 3.1 Build UnitHistoryModal component
  - Create modal layout with unit information header
  - Implement request history table with proper columns
  - Add modal open/close functionality with proper focus management
  - Ensure accessibility compliance for modal interactions
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 3.2 Implement request history pagination
  - Add pagination controls for navigating large histories
  - Implement efficient data loading for paginated results
  - Add loading states for page transitions
  - Create proper URL state management for pagination
  - _Requirements: 2.4, 2.5_

- [x] 3.3 Add request timeline formatting
  - Display requests in chronological order with proper formatting
  - Show channel icons and category badges
  - Implement status indicators with color coding
  - Add masked content display with privacy protection
  - _Requirements: 2.2, 2.3, 6.1, 6.2_

- [x] 4. Add database optimizations and indexing
  - Create database indexes for apartment unit queries
  - Optimize aggregation queries for performance
  - Add query result caching for frequently accessed data
  - Implement proper error handling for database operations
  - _Requirements: Performance and scalability requirements_

- [x] 4.1 Create database indexes for unit analytics
  - Add indexes on apartmentUnit JSON fields (dong, ho)
  - Create composite indexes for common query patterns
  - Add indexes on createdAt and classification fields
  - Test query performance with indexes
  - _Requirements: Performance optimization_

- [x] 4.2 Implement query result caching
  - Add Redis caching for frequently accessed unit analytics
  - Implement cache invalidation on new message creation
  - Create cache warming strategies for popular queries
  - Add cache hit/miss monitoring and metrics
  - _Requirements: Performance optimization_

- [x] 5. Add comprehensive testing and error handling
  - Write unit tests for analytics service methods
  - Create integration tests for API endpoints
  - Add frontend component tests with user interactions
  - Implement end-to-end tests for complete user workflows
  - _Requirements: All requirements validation_

- [x] 5.1 Write backend unit tests
  - Test analytics service query building and data aggregation
  - Test API endpoint parameter validation and response formatting
  - Test error handling for various failure scenarios
  - Test CSV export generation and formatting
  - _Requirements: All backend requirements_

- [x] 5.2 Create frontend component tests
  - Test UnitAnalyticsSection rendering and interactions
  - Test UnitHistoryModal functionality and pagination
  - Test filter integration and state management
  - Test loading states and error handling
  - _Requirements: All frontend requirements_

- [x] 5.3 Implement integration tests
  - Test complete API request/response cycles
  - Test database query performance and accuracy
  - Test export functionality with various filter combinations
  - Test privacy masking and security measures
  - _Requirements: All integration requirements_

- [x] 6. Add privacy compliance and security measures
  - Implement content masking for all displayed data
  - Add access logging for unit data viewing
  - Ensure PII protection in exports and API responses
  - Add rate limiting and input validation
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 6.1 Implement comprehensive content masking
  - Ensure all request content is properly masked in UI
  - Add sender information masking (phone/email)
  - Implement consistent masking across all components
  - Test masking with various content types and languages
  - _Requirements: 6.1, 6.2_

- [x] 6.2 Add access logging and audit trails
  - Log all unit analytics access with user information
  - Record which specific unit histories are viewed
  - Implement audit trail for export operations
  - Add monitoring and alerting for unusual access patterns
  - _Requirements: 6.4, 6.5_

- [x] 7. Performance optimization and monitoring
  - Add performance monitoring for analytics queries
  - Implement query optimization based on usage patterns
  - Add frontend performance monitoring for large datasets
  - Create alerting for slow queries or high resource usage
  - _Requirements: Performance requirements_

- [x] 7.1 Add query performance monitoring
  - Implement query execution time tracking
  - Add slow query logging and alerting
  - Create performance dashboards for analytics endpoints
  - Optimize queries based on production usage patterns
  - _Requirements: Performance optimization_

- [x] 7.2 Implement frontend performance optimization
  - Add virtual scrolling for large unit lists
  - Implement efficient re-rendering with React optimization
  - Add performance monitoring for component render times
  - Optimize bundle size and loading performance
  - _Requirements: Frontend performance_