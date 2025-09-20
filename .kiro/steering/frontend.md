# Frontend Structure & Guidelines

## Frontend Architecture Overview

The AI Secretary frontend follows a simple, effective architecture optimized for Korean apartment complex operations:

- **Static HTML pages** with modern CSS (Tailwind)
- **Vanilla JavaScript** for interactivity and API calls
- **Responsive design** for desktop and mobile use
- **Korean-first localization** throughout the interface

## Directory Structure

```
public/
├── index.html          # Landing page with feature overview
├── dashboard.html      # Real-time operations dashboard
├── test.html          # Interactive API testing interface
└── assets/            # Static assets (when needed)
    ├── css/           # Custom stylesheets
    ├── js/            # Shared JavaScript modules
    └── images/        # Icons and images
```

## Page Structure Standards

### HTML Template Pattern
All pages follow this consistent structure:

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Secretary - [Page Title]</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <!-- Page-specific styles -->
</head>
<body class="bg-gray-50">
    <!-- Navigation -->
    <nav class="gradient-bg shadow-lg">
        <!-- Consistent navigation across all pages -->
    </nav>
    
    <!-- Main Content -->
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <!-- Page content -->
    </div>
    
    <!-- JavaScript -->
    <script>
        // Page-specific functionality
    </script>
</body>
</html>
```

### Navigation Standards
- **Consistent header** across all pages
- **Korean text** for all navigation items
- **Active state indicators** for current page
- **Responsive hamburger menu** for mobile

## Page-Specific Guidelines

### 1. Landing Page (`index.html`)
**Purpose**: Marketing and feature overview
**Key Elements**:
- Hero section with gradient background
- Feature cards with Korean descriptions
- Call-to-action buttons to test and dashboard
- Footer with company information

### 2. Dashboard (`dashboard.html`)
**Purpose**: Real-time system monitoring
**Key Elements**:
- Statistics cards (총 접수, 활성 티켓, SLA 준수율, 위험 점수)
- Recent messages table with Korean status labels
- API endpoint status indicators
- Auto-refresh functionality (30-second intervals)
- Manual refresh button

**Data Loading Pattern**:
```javascript
async function loadDashboardData() {
    try {
        // Load intake stats
        const response = await fetch('/api/intake/stats');
        const data = await response.json();
        // Update UI elements
    } catch (error) {
        console.error('Error loading data:', error);
    }
}
```

### 3. Test Page (`test.html`)
**Purpose**: Interactive API testing
**Key Elements**:
- Form sections for each intake channel (SMS, Email, Web, Call)
- Pre-filled Korean examples
- Real-time result display with JSON formatting
- Color-coded success/error responses
- Health check functionality

## Styling Guidelines

### Color Scheme
- **Primary**: Gradient blue-purple (`#667eea` to `#764ba2`)
- **Success**: Green (`bg-green-100 text-green-800`)
- **Warning**: Yellow (`bg-yellow-100 text-yellow-800`)
- **Error**: Red (`bg-red-100 text-red-800`)
- **Info**: Blue (`bg-blue-100 text-blue-800`)

### Typography
- **Headers**: Bold, clear hierarchy (text-3xl, text-xl, text-lg)
- **Body**: Readable font sizes (text-base, text-sm)
- **Korean text**: Optimized for Korean character display

### Component Patterns

#### Status Badges
```html
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
    활성
</span>
```

#### Form Inputs
```html
<input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md" 
       placeholder="Korean placeholder text">
```

#### Buttons
```html
<button class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
    Korean Button Text
</button>
```

## JavaScript Standards

### API Call Pattern
```javascript
async function callAPI(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (data) options.body = JSON.stringify(data);
        
        const response = await fetch(endpoint, options);
        const result = await response.json();
        
        displayResult(result, !response.ok);
    } catch (error) {
        displayResult({ error: error.message }, true);
    }
}
```

### Result Display Pattern
```javascript
function displayResult(elementId, data, isError = false) {
    const element = document.getElementById(elementId);
    element.className = `mt-4 p-4 rounded-md ${isError ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`;
    element.innerHTML = `<pre class="text-sm ${isError ? 'text-red-800' : 'text-green-800'}">${JSON.stringify(data, null, 2)}</pre>`;
    element.classList.remove('hidden');
}
```

## Korean Localization Standards

### Text Content
- **All UI text in Korean**: 메뉴, 버튼, 라벨, 메시지
- **Status labels**: 대기중, 처리중, 완료, 오류
- **Priority levels**: 긴급, 높음, 보통, 낮음
- **Channel names**: SMS, 이메일, 웹폼, 통화

### Date/Time Formatting
```javascript
new Date().toLocaleString('ko-KR')
// Output: 2024. 12. 25. 오후 3:30:45
```

### Number Formatting
```javascript
(1234.56).toLocaleString('ko-KR')
// Output: 1,234.56
```

## Responsive Design Guidelines

### Breakpoints (Tailwind)
- **Mobile**: Default (< 640px)
- **Tablet**: `sm:` (≥ 640px)
- **Desktop**: `lg:` (≥ 1024px)
- **Large**: `xl:` (≥ 1280px)

### Grid Patterns
```html
<!-- Responsive grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <!-- Cards adapt to screen size -->
</div>
```

## Performance Guidelines

### Loading States
- Show loading indicators for API calls
- Graceful error handling with user-friendly messages
- Skeleton screens for data-heavy components

### Caching Strategy
- Cache static assets with appropriate headers
- Use browser storage for user preferences
- Implement service worker for offline functionality (future)

## Security Considerations

### Content Security Policy
The backend is configured with CSP that allows:
- `script-src: 'self' 'unsafe-inline'` - For inline scripts
- `style-src: 'self' 'unsafe-inline' https://cdn.jsdelivr.net` - For Tailwind CSS
- `connect-src: 'self'` - For API calls

### Input Validation
- Client-side validation for user experience
- Server-side validation for security
- Sanitize all user inputs before display

## Testing Guidelines

### Manual Testing Checklist
- [ ] All pages load correctly
- [ ] Navigation works across pages
- [ ] API calls succeed and display results
- [ ] Error states display properly
- [ ] Mobile responsiveness works
- [ ] Korean text displays correctly

### Browser Compatibility
- **Primary**: Chrome, Safari (macOS focus)
- **Secondary**: Firefox, Edge
- **Mobile**: iOS Safari, Chrome Mobile

## Future Enhancements

### Planned Features
- **Real-time updates** with WebSocket connections
- **Progressive Web App** capabilities
- **Advanced filtering** and search functionality
- **Export capabilities** for reports and data
- **User authentication** interface
- **Multi-language support** (Korean + English)

### Component Library
Consider extracting common components into reusable modules:
- Form components
- Status indicators
- Data tables
- Modal dialogs
- Toast notifications

## Development Workflow

### Adding New Pages
1. Create HTML file in `public/` directory
2. Follow the standard template structure
3. Add navigation links in existing pages
4. Implement page-specific JavaScript
5. Test across different screen sizes
6. Verify Korean text rendering

### Modifying Existing Pages
1. Maintain consistent styling patterns
2. Update navigation if page title changes
3. Test API integrations after changes
4. Verify responsive behavior
5. Check console for JavaScript errors

This frontend structure ensures consistency, maintainability, and optimal user experience for Korean apartment complex operations.