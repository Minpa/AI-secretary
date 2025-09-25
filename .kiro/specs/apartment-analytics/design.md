# Apartment Unit Analytics Design Document

## Overview

This document outlines the technical design for adding apartment unit analytics to the reports page. The feature will provide insights into which apartment units (동/호수) are most active and allow detailed drill-down into specific unit request histories.

## Architecture

### High-Level Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Reports UI    │────│  Analytics API   │────│   Database      │
│                 │    │                  │    │                 │
│ • Top Units     │    │ • Unit Stats     │    │ • Messages      │
│ • History Modal │    │ • History Query  │    │ • Apartment     │
│ • Export Button │    │ • Export Data    │    │   Units         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Data Flow

1. **Page Load**: Reports page requests unit analytics data
2. **Filter Changes**: Analytics update based on applied filters
3. **Unit Selection**: Click triggers history modal with detailed data
4. **Export**: Generate and download CSV with current filter state

## Components and Interfaces

### Frontend Components

#### 1. UnitAnalyticsSection Component
```typescript
interface UnitAnalyticsProps {
  dateRange: DateRange;
  categoryFilter: string[];
  onUnitSelect: (unit: ApartmentUnit) => void;
}

interface TopUnit {
  apartmentUnit: ApartmentUnit;
  requestCount: number;
  lastRequestDate: string;
  primaryCategory: string;
  categoryDistribution: Record<string, number>;
}
```

#### 2. UnitHistoryModal Component
```typescript
interface UnitHistoryProps {
  unit: ApartmentUnit;
  isOpen: boolean;
  onClose: () => void;
}

interface UnitHistoryData {
  unit: ApartmentUnit;
  totalRequests: number;
  dateRange: { start: string; end: string };
  requests: UnitRequest[];
  pagination: PaginationInfo;
}
```

#### 3. UnitMetrics Component
```typescript
interface UnitMetricsProps {
  metrics: {
    totalActiveUnits: number;
    averageRequestsPerUnit: number;
    mostActiveBuilding: string;
    peakPeriod: string;
  };
}
```

### Backend API Endpoints

#### 1. Get Unit Analytics
```typescript
GET /api/reports/units/analytics
Query Parameters:
- startDate?: string
- endDate?: string
- categories?: string[]
- limit?: number (default: 10)

Response: {
  success: boolean;
  data: {
    topUnits: TopUnit[];
    metrics: UnitMetrics;
    summary: {
      totalActiveUnits: number;
      totalRequests: number;
      dateRange: DateRange;
    };
  };
}
```

#### 2. Get Unit History
```typescript
GET /api/reports/units/:dong/:ho/history
Query Parameters:
- startDate?: string
- endDate?: string
- categories?: string[]
- page?: number
- limit?: number (default: 10)

Response: {
  success: boolean;
  data: UnitHistoryData;
}
```

#### 3. Export Unit Analytics
```typescript
GET /api/reports/units/export
Query Parameters:
- startDate?: string
- endDate?: string
- categories?: string[]
- format: 'csv'

Response: CSV file download
```

## Data Models

### Database Schema Extensions

#### Messages Table (existing, with apartment unit data)
```sql
-- Already exists with apartmentUnit JSON field
SELECT 
  id,
  content,
  maskedContent,
  channel,
  priority,
  status,
  classification,
  apartmentUnit, -- JSON: {dong, ho, floor, formatted, confidence}
  createdAt,
  updatedAt
FROM messages;
```

#### Unit Analytics Queries

##### Top Units Query
```sql
SELECT 
  apartmentUnit->>'dong' as dong,
  apartmentUnit->>'ho' as ho,
  apartmentUnit->>'formatted' as formatted,
  COUNT(*) as request_count,
  MAX(createdAt) as last_request_date,
  MODE() WITHIN GROUP (ORDER BY classification) as primary_category,
  json_object_agg(classification, category_count) as category_distribution
FROM messages 
WHERE apartmentUnit IS NOT NULL
  AND createdAt BETWEEN $1 AND $2
  AND ($3::text[] IS NULL OR classification = ANY($3))
GROUP BY apartmentUnit->>'dong', apartmentUnit->>'ho', apartmentUnit->>'formatted'
ORDER BY request_count DESC, last_request_date DESC
LIMIT $4;
```

##### Unit History Query
```sql
SELECT 
  id,
  content,
  maskedContent,
  channel,
  priority,
  status,
  classification,
  createdAt,
  sender,
  maskedSender
FROM messages 
WHERE apartmentUnit->>'dong' = $1 
  AND apartmentUnit->>'ho' = $2
  AND createdAt BETWEEN $3 AND $4
  AND ($5::text[] IS NULL OR classification = ANY($5))
ORDER BY createdAt DESC
LIMIT $6 OFFSET $7;
```

### TypeScript Interfaces

```typescript
interface ApartmentUnit {
  dong: number;
  ho: number;
  floor: number;
  formatted: string;
  confidence: number;
}

interface TopUnit {
  apartmentUnit: ApartmentUnit;
  requestCount: number;
  lastRequestDate: string;
  primaryCategory: string;
  categoryDistribution: Record<string, number>;
}

interface UnitRequest {
  id: string;
  content: string;
  maskedContent: string;
  channel: 'sms' | 'email' | 'web' | 'call';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'classified' | 'assigned' | 'processed';
  classification: string;
  createdAt: string;
  sender: string;
  maskedSender: string;
}

interface UnitMetrics {
  totalActiveUnits: number;
  averageRequestsPerUnit: number;
  mostActiveBuilding: string;
  peakPeriod: string;
}
```

## UI Design

### Reports Page Layout Enhancement

```
┌─────────────────────────────────────────────────────────────┐
│ Reports Dashboard                                           │
├─────────────────────────────────────────────────────────────┤
│ [Existing Filters: Date Range] [Categories] [Export]       │
├─────────────────────────────────────────────────────────────┤
│ [Existing Charts and Analytics]                             │
├─────────────────────────────────────────────────────────────┤
│ 🏢 Top Requesting Units                    [Export Units]   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Rank │ Unit      │ Requests │ Last Activity │ Category │ │
│ │  1   │ 101동 1502호│    15    │ 2 hours ago   │ 소음     │ │
│ │  2   │ 203동 805호 │    12    │ 1 day ago     │ 시설관리  │ │
│ │  3   │ 105동 1204호│    10    │ 3 days ago    │ 주차     │ │
│ │ ...  │ ...       │   ...    │ ...           │ ...      │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 📊 Unit Metrics                                             │
│ • Total Active Units: 45  • Avg Requests/Unit: 3.2         │
│ • Most Active Building: 101동  • Peak Period: 오후 2-4시    │
└─────────────────────────────────────────────────────────────┘
```

### Unit History Modal

```
┌─────────────────────────────────────────────────────────────┐
│ 📋 Request History - 101동 1502호                     [✕]   │
├─────────────────────────────────────────────────────────────┤
│ 🏢 Unit Info: 15층, Total Requests: 15 (Last 30 days)      │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Date/Time    │ Channel │ Category │ Status    │ Content │ │
│ │ 2025-09-25   │ SMS     │ 소음     │ Processed │ 윗집... │ │
│ │ 14:30        │         │          │           │         │ │
│ │ 2025-09-23   │ Email   │ 시설관리  │ Assigned  │ 엘리... │ │
│ │ 09:15        │         │          │           │         │ │
│ │ ...          │ ...     │ ...      │ ...       │ ...     │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    [Previous] Page 1 of 3 [Next]           │
│                         [Close]                             │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling

### Frontend Error States
- **No Data**: Display empty state with helpful message
- **Loading**: Show skeleton loaders for analytics sections
- **API Errors**: Display error messages with retry options
- **Export Errors**: Show toast notifications with error details

### Backend Error Handling
- **Invalid Parameters**: Return 400 with validation errors
- **Database Errors**: Return 500 with generic error message
- **No Data Found**: Return 200 with empty arrays
- **Export Failures**: Return 500 with error details

## Testing Strategy

### Unit Tests
- **Analytics Service**: Test query building and data aggregation
- **API Controllers**: Test parameter validation and response formatting
- **Frontend Components**: Test rendering and user interactions

### Integration Tests
- **API Endpoints**: Test full request/response cycles
- **Database Queries**: Test query performance and accuracy
- **Export Functionality**: Test CSV generation and download

### E2E Tests
- **User Workflow**: Test complete analytics viewing flow
- **Filter Integration**: Test analytics updates with filter changes
- **Modal Interactions**: Test unit history modal functionality

## Performance Considerations

### Database Optimization
- **Indexes**: Create indexes on apartmentUnit JSON fields
- **Query Optimization**: Use efficient aggregation queries
- **Caching**: Cache frequently accessed analytics data

### Frontend Performance
- **Lazy Loading**: Load unit history only when modal opens
- **Pagination**: Limit data transfer with pagination
- **Debouncing**: Debounce filter changes to reduce API calls

### Scalability
- **Data Limits**: Implement reasonable limits on data ranges
- **Background Processing**: Consider background jobs for large exports
- **Memory Management**: Optimize large dataset handling

## Security Considerations

### Data Privacy
- **Content Masking**: Always display masked content in UI
- **PII Protection**: Exclude PII from exports and logs
- **Access Logging**: Log who accesses which unit data

### API Security
- **Authentication**: Require valid session for all endpoints
- **Rate Limiting**: Implement rate limits on analytics endpoints
- **Input Validation**: Validate all query parameters

## Implementation Phases

### Phase 1: Backend API
1. Create analytics service with database queries
2. Implement API endpoints for unit analytics
3. Add unit history endpoint with pagination
4. Create export functionality

### Phase 2: Frontend Integration
1. Add unit analytics section to reports page
2. Implement top units display with sorting
3. Create unit history modal component
4. Integrate with existing filter system

### Phase 3: Enhancement & Polish
1. Add unit metrics and summary statistics
2. Implement CSV export functionality
3. Add loading states and error handling
4. Performance optimization and testing

This design provides a comprehensive foundation for implementing apartment unit analytics while maintaining performance, security, and user experience standards.