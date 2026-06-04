# HOD Recommendation Period Frontend - Implementation Guide

## Overview
This frontend implementation allows HODs (Heads of Department) to recommend books for their departments within a configurable period **after an order period closes**. Librarians can set and extend this period (default 7 days) for all faculties or individually.

## Features Implemented

### 1. **Librarian Dashboard - Order Time Periods Page**

#### New Settings Button
- Located in the page header with gear icon
- Allows librarians to set the **default HOD recommendation period** (default: 7 days)
- Changes apply to all active order periods

#### New HOD Deadline Column
- Shows the deadline date when HODs must complete their recommendations
- Calculated as: **Order Period End Date + HOD Period Days**
- Color-coded status:
  - 🟢 **Green**: Deadline is far away (>3 days)
  - 🟠 **Orange ⏰**: Deadline is approaching (≤3 days)
  - 🔴 **Red ⏱️**: Deadline has passed (≤0 days)

#### New Clock Icon Button
- Extends the HOD recommendation period for a specific faculty
- Opens modal to:
  - Enter number of days to add
  - Preview new deadline
  - Confirm extension

### 2. **HOD Dashboard Page**

#### New Deadline Card
- Shows HOD recommendation deadline for their department
- Displays days remaining with color-coded status
- Shows whether status is "Active" or "Expired"
- Two action states:
  - **Active**: Button to submit recommendations
  - **Expired**: Message to contact librarian for extension

#### Deadline Warnings
- 🟠 **Orange warning**: When 3 days or less remain
- 🔴 **Red alert**: When deadline has passed

### 3. **HOD Submit Recommendation Page** (New)

#### Deadline Display
- Shows current deadline and days remaining
- Color-coded status indicator
- Warning messages when deadline approaching or expired

#### Recommendation Form
- Required fields: Title, Author
- Optional fields: ISBN, Publisher, Edition, Additional Notes
- Submit button (disabled if deadline expired)
- Success message after submission

#### Department Recommendations View
- Shows all books previously submitted by the HOD's department
- Displays as a table with key information
- Updates after each submission

## How It Works

### Timeline Example
```
Order Period: Jan 1 - Mar 31, 2026
↓
Order Period Ends: Mar 31, 2026
↓
HOD Deadline Created: Apr 7, 2026 (7 days)
↓
HODs can recommend books: Apr 1 - Apr 7
↓
If extended by 5 days: Apr 12, 2026
↓
Final Deadline: Apr 12, 2026
```

## File Changes

### Modified Files

#### `client/src/pages/librarian/OrderTimePeriodsPage.jsx`
- Added new state management for HOD periods:
  - `defaultHodDays`: Global default period length
  - `hodRecommendationDays`: Period length per order period
  - `extendingPeriodId`: Track which period is being extended
  
- New functions:
  - `calculateHodRecommendationDeadline()`: Calculate deadline date
  - `handleSaveDefaultHodDays()`: Save default period setting
  - `handleExtendHodDeadline()`: Initiate extension
  - `handleConfirmExtension()`: Confirm and apply extension

- Updated table:
  - New "HOD Deadline" column with color-coded dates
  - Clock icon button for extending period
  - Color indicators for deadline status

- New modals:
  - **Settings Modal**: Change default HOD period days
  - **Extension Modal**: Extend period for specific faculty

#### `client/src/pages/hod/HodDashboardPage.jsx`
- Added HOD deadline card display
- Shows deadline date, days remaining, and status
- Button to navigate to submission page
- Conditional warnings based on deadline status

### New Files Created

#### `client/src/pages/hod/HodSubmitRecommendationPage.jsx`
- Full page for HOD to submit book recommendations
- Shows deadline and remaining days
- Form with title, author, ISBN, publisher, edition, notes
- Displays department's previous submissions
- Prevents submission if deadline expired

## Component Usage

### OrderTimePeriodsPage Props
```jsx
<OrderTimePeriodsPage
  onViewChange={(view) => {}}  // Navigate to different views
  onSelectPeriod={(period) => {}}  // Select a period
/>
```

### HodDashboardPage Props
```jsx
<HodDashboardPage
  user={user}  // User object with department info
  stats={stats}  // Dashboard statistics
  items={items}  // Recommendation items
  onViewChange={(view) => {}}  // Navigate to different views
/>
```

### HodSubmitRecommendationPage Props
```jsx
<HodSubmitRecommendationPage
  user={user}  // User object with department info
  items={items}  // Existing recommendations
/>
```

## State Management

### OrderTimePeriodsPage State
```javascript
periods = [
  {
    id: 1,
    faculty: "Engineering Faculty",
    startDate: "2026-01-01",
    endDate: "2026-03-31",
    status: "active",
    hodRecommendationDays: 7  // NEW: HOD period length
  }
]

defaultHodDays: 7  // NEW: Default period for all faculties
showSettingsModal: false  // NEW: Settings modal visibility
extendingPeriodId: null  // NEW: Which period is being extended
extendDays: ""  // NEW: Days to add in extension
```

### HodDashboardPage State
```javascript
hodDeadline: Date  // Calculated deadline
daysRemaining: number  // Days until deadline
```

### HodSubmitRecommendationPage State
```javascript
formData: {
  title: "",
  author: "",
  isbn: "",
  publisher: "",
  edition: "",
  additionalNotes: ""
}

submitted: boolean  // Show success message
submitting: boolean  // Loading state
hodDeadline: Date  // Deadline for submissions
daysRemaining: number  // Days remaining
```

## UI/UX Highlights

### Color Scheme
- 🟢 **Green (#2e7d32)**: Active, plenty of time
- 🟠 **Orange (#ff6f00)**: Urgent, deadline approaching
- 🔴 **Red (#d32f2f)**: Expired, past deadline

### Icons Used
- ⚙️ **Settings icon**: Configure default period
- 🕐 **Clock icon**: Extend deadline
- ✅ **Success**: Submission confirmed
- ⏰ **Warning**: Deadline approaching
- ⏱️ **Alert**: Deadline expired

### Modals
1. **Settings Modal**
   - Change default HOD period days
   - Shows impact on active periods
   - Confirm/Cancel buttons

2. **Extension Modal**
   - Faculty name display
   - Current deadline shown
   - Input for days to add
   - Real-time preview of new deadline
   - Confirm/Cancel buttons

## User Workflows

### Librarian: Set Default HOD Period
1. Click "HOD Period Settings" button
2. Enter desired number of days (default: 7)
3. Click "Save Settings"
4. All active periods update automatically

### Librarian: Extend Period for Specific Faculty
1. Find faculty in Active Periods table
2. Click Clock icon (🕐)
3. Enter number of days to add
4. Review new deadline preview
5. Click "Extend Period"

### HOD: Submit Recommendations
1. View HOD Dashboard
2. See deadline and days remaining
3. If deadline active, click "Submit Recommendation"
4. Fill in book details (Title, Author required)
5. Click "Submit Recommendation"
6. See success message
7. View submitted books in the table below

### HOD: Check Deadline Status
1. View HOD Dashboard
2. See deadline card with:
   - Deadline date
   - Days remaining
   - Color-coded status
   - Warnings if approaching or expired

## Mock Data

The current implementation uses mock data for deadlines:
- Order period ends: March 31, 2026
- Default HOD period: 7 days
- Calculated deadline: April 7, 2026

To integrate with backend, replace mock data with API calls:

```javascript
// Example integration points
const [hodDeadline, setHodDeadline] = useState(null);

useEffect(() => {
  // Call API to fetch deadline
  API.fetchHodDeadline(facultyId).then(setHodDeadline);
}, [facultyId]);
```

## Responsive Design

- **Page header**: Settings button positioned top-right
- **Deadline card**: Uses flexbox, mobile-friendly
- **Table**: Scrollable on small screens with icon buttons
- **Modals**: Full viewport overlay, centered content
- **Form fields**: Responsive grid layout

## Accessibility Features

- Color-coded but also uses text labels
- Icon buttons have title attributes
- Modal overlays prevent interaction with background
- Form labels properly associated with inputs
- Clear warning messages with emojis for quick scanning

## Future Enhancements

1. **Backend Integration**
   - Store deadline dates in database
   - API endpoints for CRUD operations
   - Automatic deadline calculation on period creation

2. **Notifications**
   - Email reminders to HODs when approaching deadline
   - System notifications in dashboard

3. **Extension History**
   - Track all extensions with timestamps
   - Show who made each extension and why

4. **Department Management**
   - Assign different periods to different departments
   - Bulk operations for multiple departments

5. **Reports**
   - Export HOD recommendations by department
   - Track submission rates and compliance

## Testing Checklist

- [ ] Settings modal opens and saves default days
- [ ] HOD deadline column displays correctly
- [ ] Color coding changes based on deadline status
- [ ] Clock icon extends period correctly
- [ ] New deadline preview shows accurate date
- [ ] HOD can view deadline on dashboard
- [ ] HOD can submit recommendations when active
- [ ] HOD cannot submit when deadline expired
- [ ] Warning messages appear appropriately
- [ ] Form validation works (title, author required)
- [ ] Success message shows after submission
- [ ] Department recommendations display correctly
