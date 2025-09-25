# Apartment Unit Analytics Requirements

## Introduction

This feature adds apartment unit analytics to the reports page, allowing property managers to identify the most active units (동/호수) and view detailed request histories for specific apartments. This enables proactive management, pattern identification, and targeted maintenance planning for Korean apartment complexes.

## Requirements

### Requirement 1: Top Requesting Units Display

**User Story:** As a property manager, I want to see which apartment units (동/호수) submit the most requests, so that I can identify units that may need special attention or have recurring issues.

#### Acceptance Criteria

1. WHEN I visit the reports page THEN the system SHALL display a "Top Requesting Units" section
2. WHEN the top units are displayed THEN the system SHALL show the top 10 units by request count
3. WHEN displaying each unit THEN the system SHALL show:
   - Apartment unit (formatted as "101동 1502호")
   - Total request count
   - Most recent request date
   - Primary issue category (most frequent)
4. WHEN units have the same request count THEN the system SHALL sort by most recent activity
5. WHEN no apartment unit data exists THEN the system SHALL display "No apartment unit data available"

### Requirement 2: Unit Request History Drill-Down

**User Story:** As a property manager, I want to click on a specific apartment unit to see its complete request history, so that I can understand patterns and provide better service to residents.

#### Acceptance Criteria

1. WHEN I click on an apartment unit in the top units list THEN the system SHALL display a detailed history modal
2. WHEN the history modal opens THEN the system SHALL show:
   - Unit information (동, 호수, floor)
   - Total request count and date range
   - Chronological list of all requests from that unit
3. WHEN displaying each request in history THEN the system SHALL show:
   - Request date and time
   - Channel (SMS, Email, Web, Call)
   - Issue category and priority
   - Request content (masked for privacy)
   - Current status
4. WHEN the history has many requests THEN the system SHALL paginate results (10 per page)
5. WHEN I want to close the history THEN the system SHALL provide a close button

### Requirement 3: Unit Analytics Integration

**User Story:** As a property manager, I want the apartment analytics to integrate with existing report filters, so that I can analyze unit patterns within specific time periods or categories.

#### Acceptance Criteria

1. WHEN I apply date filters THEN the unit analytics SHALL respect the selected date range
2. WHEN I apply category filters THEN the unit analytics SHALL show only requests from selected categories
3. WHEN filters are applied THEN the top units ranking SHALL update accordingly
4. WHEN I clear filters THEN the unit analytics SHALL return to showing all-time data
5. WHEN no data matches filters THEN the system SHALL display appropriate empty state messages

### Requirement 4: Unit Performance Metrics

**User Story:** As a property manager, I want to see performance metrics for apartment units, so that I can identify trends and plan maintenance proactively.

#### Acceptance Criteria

1. WHEN viewing unit analytics THEN the system SHALL display summary metrics:
   - Total units with requests
   - Average requests per active unit
   - Most active building (동)
   - Peak request time period
2. WHEN displaying building-level data THEN the system SHALL group units by 동 (building)
3. WHEN showing time-based patterns THEN the system SHALL identify peak request periods
4. WHEN calculating averages THEN the system SHALL exclude units with zero requests
5. WHEN metrics cannot be calculated THEN the system SHALL show "Insufficient data"

### Requirement 5: Export Unit Data

**User Story:** As a property manager, I want to export apartment unit analytics data, so that I can share insights with building management or conduct offline analysis.

#### Acceptance Criteria

1. WHEN I want to export unit data THEN the system SHALL provide an "Export Unit Analytics" button
2. WHEN I click export THEN the system SHALL generate a CSV file containing:
   - Unit information (동, 호수, floor, formatted address)
   - Request counts by category
   - Date range of activity
   - Most recent request date
3. WHEN exporting with filters applied THEN the CSV SHALL contain only filtered data
4. WHEN the export is ready THEN the system SHALL automatically download the file
5. WHEN export fails THEN the system SHALL display an error message

### Requirement 6: Privacy and Security

**User Story:** As a property manager, I want apartment unit analytics to respect privacy requirements, so that resident information remains protected while still providing useful insights.

#### Acceptance Criteria

1. WHEN displaying request content THEN the system SHALL show only masked content
2. WHEN showing resident contact information THEN the system SHALL display masked phone numbers/emails
3. WHEN exporting data THEN the system SHALL include only non-PII information
4. WHEN logging analytics access THEN the system SHALL record who viewed which unit data
5. WHEN a unit has sensitive requests THEN the system SHALL apply appropriate access controls

## Technical Considerations

### Data Requirements
- Apartment unit information must be parsed and stored with messages
- Analytics queries should be optimized for performance
- Historical data should be preserved for trend analysis

### Performance Requirements
- Unit analytics should load within 2 seconds
- History modal should open within 1 second
- Export generation should complete within 30 seconds for up to 1000 units

### Integration Points
- Reports page existing filter system
- Message database with apartment unit data
- Export functionality integration
- Privacy masking system

## Success Metrics

- Property managers can identify top requesting units within 3 clicks
- Unit history provides actionable insights for maintenance planning
- Export functionality enables data sharing with stakeholders
- Privacy requirements are maintained throughout the feature