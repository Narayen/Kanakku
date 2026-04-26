# ET - Code Architecture & Logic Report

## 📋 Document Overview
This comprehensive report details the architecture, design patterns, and implementation logic of every major component and utility in the ET expense tracking application.

---

## 1. Core Application Files

### 1.1 `App.tsx` - Main Application Component

**Purpose**: Root component that wraps the entire application with providers and defines routing structure.

**Key Logic Breakdown**:

```typescript
const ThemeController = () => {
  const { currentProfile } = useData();
  
  useEffect(() => {
    // Logic: Listen for theme preference and apply CSS class to root
    if (theme === 'system') {
      // System mode: Watch OS preference changes via media query
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches); // Apply current OS setting
      
      // Subscribe to preference changes
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // Explicit mode: Apply user's choice (light or dark)
      applyTheme(theme === 'dark');
    }
  }, [currentProfile?.themePreference]);
```

**Component Hierarchy**:
```
App (Root)
├── ErrorBoundary (Error catching)
├── ToastProvider (Notification context)
├── DataProvider (Global state management)
├── ThemeController (Apply CSS theme class)
└── HashRouter (React Router)
    └── Layout (Main navigation)
        └── Routes (Page components)
            ├── Home
            ├── Books
            ├── Analytics
            └── Settings
```

**What Each Provider Does**:
- **ErrorBoundary**: Catches unhandled errors in child components, displays fallback UI
- **ToastProvider**: Manages toast notifications (success, error, warning messages)
- **DataProvider**: Provides global state (profiles, books, transactions, categories)
- **ThemeController**: Watches profile theme preference and applies dark mode CSS

---

### 1.2 `index.tsx` - Entry Point

**Purpose**: Initialize React and render App to DOM.

**Logic**:
1. Get root element from HTML (must exist and have id="root")
2. Create React root using `ReactDOM.createRoot()`
3. Render App component in strict mode for development warnings
4. Throw error if root element not found (fail-fast pattern)

---

## 2. Type Definitions & Constants

### 2.1 `types.ts` - TypeScript Interfaces

**Enums**:
- **TransactionType.INCOME / EXPENSE**: Categorizes money flow direction
- **SyncFrequency.OFF / DAILY / MONTHLY / IMMEDIATE**: Controls Google Drive backup timing
- **AutopayFrequency.DAILY / WEEKLY / MONTHLY**: Recurring payment interval

**Core Interfaces**:

```typescript
interface Profile {
  id: string;                        // Unique identifier
  name: string;                      // User-facing name
  icon: string;                      // Icon name from lucide-react
  currency: string;                  // ISO 4217 code (INR, USD, etc.)
  isCurrent: boolean;                // Active profile flag
  themePreference: 'light'|'dark'|'system';
  isPrivacyMode: boolean;            // Mask amounts display
  selectedBookIds?: string[];        // Books to include in balance calc
  syncFrequency: SyncFrequency;      // How often to sync to Drive
  googleAccessToken?: string;        // OAuth token for Drive API
  lastSyncedAt?: number;             // Timestamp of last backup
}

interface Book {
  id: string;                        // Unique identifier
  profileId: string;                 // FK to Profile
  name: string;                      // E.g., "Salary Account"
  currency: string;                  // ISO 4217 code
  description?: string;
  color: string;                     // Tailwind color class (e.g., "bg-blue-500")
}

interface Transaction {
  id: string;                        // Unique identifier
  bookId: string;                    // FK to Book
  amount: number;                    // Monetary value (positive)
  type: TransactionType;             // INCOME or EXPENSE
  categoryId: string;                // FK to Category
  date: string;                      // ISO date (YYYY-MM-DD)
  note?: string;                     // User annotation
  createdAt: number;                 // Timestamp when added
}

interface Autopay {
  id: string;                        // Unique identifier
  bookId: string;                    // FK to Book
  amount: number;                    // Recurring amount
  type: TransactionType;             // INCOME or EXPENSE
  categoryId: string;                // Default category
  note?: string;                     // Description
  frequency: AutopayFrequency;       // Recurrence pattern
  status: 'ACTIVE' | 'PAUSED';      // Enable/disable flag
  startDate: string;                 // YYYY-MM-DD when recurrence begins
  startTime?: string;                // HH:MM for daily/weekly/monthly
  lastProcessedAt?: number;          // Timestamp of last auto-creation
}

interface Category {
  id: string;                        // Unique identifier
  name: string;                      // E.g., "Food & Dining"
  icon: string;                      // Lucide icon name
  color: string;                     // Text color class (e.g., "text-orange-500")
}
```

### 2.2 `constants.ts` - Application Constants

**DEFAULT_CATEGORIES Array**:
- Provides 7 pre-configured categories with icon, color, and name
- Used as fallback if localStorage data is corrupted
- Cannot be deleted (especially "cat_other")

**Color Palettes**:
- **MOCK_COLORS**: 13 background colors for book cards
- **TEXT_COLORS**: Matching text colors for UI elements
- **TEXT_COLOR_NAMES**: Human-readable color tuples for settings UI

**PROFILE_ICONS**: 17 lucide-react icon names for profile customization
**CATEGORY_ICONS**: 32 available icons for custom categories
**CURRENCIES**: 17 supported currencies with ISO codes, symbols, flags, and names

---

## 3. Global State Management

### 3.1 `contexts/DataContext.tsx` - Central Data Hub

**This is the most complex file. It handles**:
1. Global state management for all data
2. Automatic localStorage persistence
3. Google Drive API integration
4. Business logic (autopay processing, filtering, calculations)
5. Data migration for backward compatibility

#### **Initialization Logic**:

```typescript
const STORAGE_KEY = 'expenSync_v1';

useEffect(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  
  if (saved) {
    const parsed = JSON.parse(saved);
    
    // MIGRATION: Ensure new fields exist on old data
    const loadedProfiles = (parsed.profiles || [INITIAL_PROFILE]).map((p: any) => ({
      ...p,
      isPrivacyMode: p.isPrivacyMode ?? false,      // New field default: false
      icon: p.icon ?? 'User',                        // New field default: 'User' icon
      currency: p.currency === 'USD' ? 'INR' : p.currency ?? 'INR', // Default to INR
      selectedBookIds: p.selectedBookIds ?? []       // New field default: empty (uses all books)
    }));
    
    setProfiles(loadedProfiles);
    // ... set other states
  } else {
    // First-time setup with initial empty profile and book
    setProfiles([INITIAL_PROFILE]);
    setBooks([INITIAL_BOOK]);
  }
}, []);
```

**Key Migration Strategy**:
- Uses nullish coalescing `??` to add missing fields to old data
- Converts legacy USD entries to INR (implies INR is default currency)
- Provides sensible defaults for all new optional fields

#### **Automatic Persistence**:

```typescript
// Save whenever state changes (5 different state deps)
useEffect(() => {
  if (profiles.length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      profiles, books, transactions, categories, autopays 
    }));
  }
}, [profiles, books, transactions, categories, autopays]);
```

**Gotcha**: This runs on EVERY state change, causing frequent localStorage writes. In production, consider debouncing.

#### **Profile Management Logic**:

**addProfile(name: string)**:
```typescript
const newProfile: Profile = {
  id: uuidv4(),                              // Generate unique ID
  name,
  icon: 'Smile',                             // Default friendly icon
  currency: 'INR',
  isCurrent: true,                           // Make new profile active
  themePreference: 'system',
  isPrivacyMode: false,
  selectedBookIds: [],
  syncFrequency: SyncFrequency.OFF
};

// Mark all other profiles as inactive
setProfiles(prev => {
  const updatedProfiles = prev.map(p => ({ ...p, isCurrent: false }));
  return [...updatedProfiles, newProfile];
});

// Create default book for new profile
const newBook: Book = {
  id: uuidv4(),
  profileId: newProfile.id,
  name: 'My Wallet',
  currency: 'INR',
  color: 'bg-emerald-500'
};
newProfile.selectedBookIds = [newBook.id];
setBooks(prev => [...prev, newBook]);
```

**switchProfile(id: string)**:
```typescript
// Simple map: mark target profile as current, others as inactive
setProfiles(prev => prev.map(p => ({
  ...p,
  isCurrent: p.id === id
})));
```

**updateProfileSettings(id: string, updates: Partial<Profile>)**:
```typescript
setProfiles(prev => prev.map(p => {
  if (p.id === id) {
    const updatedProfile = { ...p, ...updates };
    
    // Special logic: If currency changes, filter selectedBookIds
    // Only keep books that match the new currency
    if (updates.currency && updates.currency !== p.currency) {
      const profileBooks = books.filter(b => b.profileId === id);
      updatedProfile.selectedBookIds = (p.selectedBookIds || [])
        .filter(bookId => {
          const book = profileBooks.find(b => b.id === bookId);
          return book?.currency === updates.currency;
        });
    }
    return updatedProfile;
  }
  return p;
}));
```

**deleteProfile(id: string)**:
```typescript
setProfiles(prev => {
  if (prev.length <= 1) return prev;  // Prevent deleting last profile
  
  const isDeletingCurrent = prev.find(p => p.isCurrent)?.id === id;
  let remaining = prev.filter(p => p.id !== id);
  
  // If we deleted the active profile, make first remaining profile active
  if (isDeletingCurrent && remaining.length > 0) {
    remaining = remaining.map((p, idx) => 
      idx === 0 ? { ...p, isCurrent: true } : p
    );
  }
  return remaining;
});

// Cascade delete: Remove books and transactions belonging to this profile
setBooks(prev => {
  const booksToDelete = prev.filter(b => b.profileId === id).map(b => b.id);
  setTransactions(txs => txs.filter(t => !booksToDelete.includes(t.bookId)));
  return prev.filter(b => b.profileId !== id);
});
```

#### **Book Selection Logic**:

**toggleBookSelection(bookId: string)**:
```typescript
const book = books.find(b => b.id === bookId);

// Prevent selecting books with mismatched currency
if (book.currency !== currentProfile.currency) {
  return; // Silently fail
}

const currentSelected = currentProfile.selectedBookIds || [];
const isSelected = currentSelected.includes(bookId);

const newSelected = isSelected 
  ? currentSelected.filter(id => id !== bookId)  // Deselect
  : [...currentSelected, bookId];                // Select

updateProfileSettings(currentProfile.id, { selectedBookIds: newSelected });
```

**Why This Matters**: Prevents confusing users with balance calculations mixing different currencies.

#### **Category Management**:

**addCategory(categoryData: Omit<Category, 'id'>)**:
```typescript
const newCat: Category = { 
  ...categoryData, 
  id: `cat_${Date.now()}`  // Timestamp-based ID
};

setCategories(prev => {
  // Find "Others" category position
  const othersIndex = prev.findIndex(c => c.id === 'cat_other');
  
  // Insert new category before "Others"
  if (othersIndex === -1) return [...prev, newCat];
  
  const updated = [...prev];
  updated.splice(othersIndex, 0, newCat);
  return updated;
});
```

**deleteCategory(id: string)**:
```typescript
if (id === 'cat_other') return; // Prevent deletion of default category

// Reassign all transactions using this category to "Others"
setTransactions(prev => prev.map(t => 
  t.categoryId === id ? { ...t, categoryId: 'cat_other' } : t
));

setCategories(prev => prev.filter(c => c.id !== id));
```

#### **Transaction Management**:

**addTransaction(txData)**:
```typescript
const newTx: Transaction = {
  ...txData,
  id: uuidv4(),
  createdAt: Date.now()  // Record when transaction was added
};

// Prepend to list (most recent first)
setTransactions(prev => [newTx, ...prev]);
```

**updateTransaction & deleteTransaction**: Simple map/filter operations

#### **Autopay Processing Logic** (Most Complex):

**processAutopays()** - The heart of recurring payment automation:

```typescript
useCallback(() => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];  // YYYY-MM-DD
  const newTransactions: Transaction[] = [];
  const updatedAutopays = [...autopays];
  let changed = false;

  updatedAutopays.forEach((ap, index) => {
    if (ap.status !== 'ACTIVE') return;  // Skip paused autopays

    // Parse start date and time into Date object
    const [year, month, day] = ap.startDate.split('-').map(Number);
    const [hours, minutes] = (ap.startTime || '00:00').split(':').map(Number);
    const startDateTime = new Date(year, month - 1, day, hours, minutes);
    
    if (startDateTime > now) return;  // Not started yet

    let lastDate = ap.lastProcessedAt 
      ? new Date(ap.lastProcessedAt) 
      : startDateTime;

    // Determine if we should process based on frequency
    let shouldProcess = false;
    if (!ap.lastProcessedAt) {
      shouldProcess = true;  // First time
    } else {
      const diffMs = now.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (ap.frequency === AutopayFrequency.DAILY && diffDays >= 1) {
        shouldProcess = true;
      } else if (ap.frequency === AutopayFrequency.WEEKLY && diffDays >= 7) {
        shouldProcess = true;
      } else if (ap.frequency === AutopayFrequency.MONTHLY) {
        // Calculate month difference
        const monthsDiff = (now.getFullYear() - lastDate.getFullYear()) * 12 
                         + (now.getMonth() - lastDate.getMonth());
        if (monthsDiff >= 1) {
          shouldProcess = true;
        }
      }
    }

    if (shouldProcess) {
      // Create transaction with [Autopay] prefix in note
      const tx: Transaction = {
        id: uuidv4(),
        bookId: ap.bookId,
        amount: ap.amount,
        type: ap.type,
        categoryId: ap.categoryId,
        date: todayStr,
        note: `[Autopay] ${ap.note || ''}`,
        createdAt: Date.now()
      };
      newTransactions.push(tx);
      updatedAutopays[index] = { ...ap, lastProcessedAt: Date.now() };
      changed = true;
    }
  });

  if (changed) {
    setTransactions(prev => [...newTransactions, ...prev]);
    setAutopays(updatedAutopays);
  }
}, [autopays]);

// Run on mount and when autopays change (with 2s delay)
useEffect(() => {
  const timer = setTimeout(() => {
    processAutopays();
  }, 2000);
  return () => clearTimeout(timer);
}, [processAutopays]);
```

**Autopay Processing Algorithm**:
1. Skip if autopay is paused or start date hasn't arrived
2. On first run: create transaction immediately
3. On subsequent runs:
   - Calculate days/months elapsed since last processing
   - If frequency interval has passed, create new transaction
   - Update `lastProcessedAt` to prevent duplicates

**Gotcha**: Monthly calculation is simplistic (just compares month numbers). Doesn't account for varying month lengths. For precise behavior, consider date library like date-fns.

#### **Google Drive Integration**:

**initGoogleDrive(clientId: string)**:
```typescript
await driveService.initGapiClient();  // Load Google Drive API

driveService.initGisClient(clientId, (response) => {
  if(response.access_token && currentProfile) {
    updateProfileSettings(currentProfile.id, { googleAccessToken: response.access_token });
    driveService.setAccessToken(response.access_token);  // Set for future requests
  }
});
setIsGoogleReady(true);
```

**syncWithDrive()**:
```typescript
if (!currentProfile?.googleAccessToken) {
  await signInToGoogle();  // Prompt login if not authenticated
  return; 
}

const data = JSON.stringify({
  profile: currentProfile,
  books: books.filter(b => b.profileId === currentProfile.id),
  transactions: transactions.filter(t => 
    books.find(b => b.id === t.bookId)?.profileId === currentProfile.id
  ),
  categories
});

try {
  await driveService.uploadFile(DRIVE_FILE_NAME, data);
  updateProfileSettings(currentProfile.id, { lastSyncedAt: Date.now() });
} catch(e) {
  throw e;  // Propagate to caller for error handling
}
```

#### **Import/Export Logic**:

**downloadTemplate()**:
```typescript
if (Capacitor.isNativePlatform()) {
  // Native: Save to cache directory and share
  const result = await Filesystem.writeFile({
    path: fileName,
    data: SAMPLE_CSV,
    directory: Directory.Cache
  });
  
  await Share.share({
    files: [result.uri],
    dialogTitle: 'Save Template'
  });
} else {
  // Web: Browser download
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
}
```

**exportData()**:
```typescript
// Generate CSV from current profile's data
const csvContent = generateCSV(
  transactions.filter(t => 
    books.find(b => b.id === t.bookId)?.profileId === currentProfile.id
  ),
  books.filter(b => b.profileId === currentProfile.id),
  categories
);

// Download similar to template download
```

---

### 3.2 `contexts/ToastContext.tsx` - Notification System

**Purpose**: Provide lightweight toast notifications throughout app.

**Data Structure**:
```typescript
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;  // Auto-dismiss after ms
}
```

**Key Functions**:
- `showToast(message, type, duration)`: Show notification
- Notifications auto-dismiss after 3000ms (default)
- No queue management; overwrites previous toast (simple design)

---

## 4. UI Components

### 4.1 `components/Layout.tsx` - Main Navigation Shell

**Architecture Pattern**: Shell component with outlet routing

**Key Features**:
```typescript
<header>                           // Top navigation (sticky)
  Logo + Current Profile Name
</header>

<main className="...pb-24">        // Main content area
  <Outlet />                       // Route-specific page content
</main>

<nav>                              // Fixed bottom navigation (mobile)
  Home | Books | Analytics | Settings
</nav>
```

**Responsive Design**:
- **Mobile**: Fixed bottom navigation with `pb-24` (padding for navbar)
- **Desktop**: Uses `md:sticky` to make nav top-aligned on larger screens

**Icon Mapping Pattern**:
```typescript
const IconMap = {
  User, Smile, Zap, Star, Heart, Crown, ...
};

const ProfileIcon = IconMap[currentProfile?.icon] || User;
```

This dynamic icon selection allows user-customizable icons without hardcoding.

### 4.2 `components/TransactionModal.tsx` - Modal Wrapper

**Simple wrapper pattern**:
```typescript
{isOpen && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center">
    <div className="... bg-black/60 ..." onClick={onClose} />
    <div className="... animate-in">
      <TransactionForm ... />
    </div>
  </div>
)}
```

**Patterns Used**:
- Backdrop click to close
- Animation classes for slide-in effect
- Max height with scroll for long forms
- Highest z-index to overlay everything

### 4.3 `components/TransactionForm.tsx` - Complex Form Component

**Responsibilities**:
1. Handles both add and edit modes
2. Date/time input with validation
3. Dropdown selects for book, type, category
4. Amount input with validation
5. Optional note field
6. Submit/cancel buttons

**Form Validation**:
```typescript
if (!bookId || !categoryId || amount <= 0 || !date) {
  showToast("Please fill all required fields", "error");
  return;
}
```

**Edit Mode Logic**:
```typescript
if (editTransaction) {
  // Pre-populate form with existing data
  setFormData(editTransaction);
  setTitle(`Edit Transaction`);
} else {
  // Pre-select first available book if preSelectedBookId provided
  if (preSelectedBookId) {
    setFormData(prev => ({ ...prev, bookId: preSelectedBookId }));
  }
}
```

### 4.4 `components/AutopayModal.tsx` - Recurring Payment Setup

**Fields**:
- Amount and Type (Income/Expense)
- Book selection
- Category selection
- Frequency (Daily/Weekly/Monthly)
- Start date and optional time
- Active/paused toggle

**Recurring Date Handling**:
```typescript
const startDate = new Date(formData.startDate);
const startTime = formData.startTime || "00:00";

// Format: YYYY-MM-DD for storage
// Display formatting for user convenience
```

### 4.5 `components/ErrorBoundary.tsx` - Error Isolation

**Pattern**: React error boundary to prevent white screens

```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error(error, errorInfo);
    this.setState({ hasError: true });
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh.</div>;
    }
    return this.props.children;
  }
}
```

---

## 5. Page Components

### 5.1 `pages/Home.tsx` - Dashboard

**Data Flow**:
```
currentProfile
    ↓
filter books by profileId → profileBookIds
    ↓
selectedBookIds from profile
    ↓
filter transactions by:
  - bookId in selectedBookIds
  - book currency matches profile currency
    ↓
Calculate totalIncome, totalExpense, balance
```

**Key Computations** (all memoized):
```typescript
const profileBookIds = useMemo(() => 
  books.filter(b => b.profileId === currentProfile?.id).map(b => b.id), 
  [books, currentProfile]
);

const filteredTransactions = useMemo(() => 
  profileTransactions.filter(t => {
    const book = books.find(b => b.id === t.bookId);
    return selectedBookIds.includes(t.bookId) && 
           book?.currency === currentProfile?.currency;
  }),
  [profileTransactions, selectedBookIds, currentProfile, books]
);

const totalIncome = useMemo(() => 
  filteredTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
  [filteredTransactions]
);
```

**Privacy Masking**:
```typescript
const maskMoney = (amount: number) => 
  isPrivacy ? '****' : formatIndianCurrency(amount, globalSymbol);
```

**Book Balance Calculation**:
```typescript
const getBookBalance = (bookId: string) => {
  return transactions
    .filter(t => t.bookId === bookId)
    .reduce((acc, t) => 
      t.type === TransactionType.INCOME 
        ? acc + t.amount 
        : acc - t.amount, 
      0);
};
```

**Transaction History Sorting**:
```typescript
.sort((a, b) => {
  const dateA = a.date ? new Date(a.date).getTime() : 0;
  const dateB = b.date ? new Date(b.date).getTime() : 0;
  return dateB - dateA;  // Most recent first
})
```

### 5.2 `pages/Books.tsx` - Wallet Management

**UI Elements**:
- Green "+" button to create new book
- Card grid showing all profile books
- Edit/delete actions per book
- Currency badge display
- Book color indicator

**Create Book Flow**:
```typescript
const handleAddBook = (bookData) => {
  addBook({
    name: bookData.name,
    currency: bookData.currency,
    color: bookData.color
  });
  // Auto-selects if currency matches profile
};
```

**Book Deletion with Cascade**:
```typescript
const handleDeleteBook = (bookId) => {
  if (transactions.some(t => t.bookId === bookId)) {
    showToast("Cannot delete book with transactions", "warning");
    return;
  }
  deleteBook(bookId);  // Also deletes associated autopays
};
```

### 5.3 `pages/Analytics.tsx` - Visualization Dashboard

**Charts Used** (via Recharts):
1. **Bar Chart**: Income vs Expense comparison
2. **Pie Chart**: Category-wise spending breakdown
3. **Line Chart**: Monthly trends (if implemented)

**Data Aggregation for Charts**:
```typescript
// Category breakdown
const categoryTotals = filteredTransactions.reduce((acc, t) => {
  const catName = categories.find(c => c.id === t.categoryId)?.name || 'Other';
  acc[catName] = (acc[catName] || 0) + t.amount;
  return acc;
}, {});

const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({
  name,
  value
}));
```

### 5.4 `pages/Settings.tsx` - Configuration Hub

**Sections**:
1. **Profile Management**:
   - Create new profile
   - Switch between profiles
   - Edit profile details (name, icon, currency)
   - Delete profile

2. **Theme Settings**:
   - Light/Dark/System toggle

3. **Category Management**:
   - View all categories
   - Delete custom categories (prevent deletion if used)
   - Add new categories

4. **Google Drive Sync**:
   - Sign in button (if not authenticated)
   - Sign out button (if authenticated)
   - Manual sync trigger
   - Sync frequency setting

5. **Data Management**:
   - Export as CSV
   - Download template
   - Reset all data

**Privacy Toggle**:
```typescript
const handleTogglePrivacy = () => {
  togglePrivacyMode();
  showToast(
    isPrivacy ? "Privacy mode off" : "Privacy mode on",
    "success"
  );
};
```

---

## 6. Utility Functions

### 6.1 `utils/format.ts` - Currency Formatting

**Function**: `formatIndianCurrency(amount: number, symbol: string = '₹'): string`

**Algorithm**:
```
If amount >= 10 million (Crore):
  amount / 10000000 + " Crore"

Else if amount >= 100000 (Lakh):
  amount / 100000 + " Lakh"

Else:
  Apply Indian numbering (groups of 2 after first 3)
  12345 → 1,23,45
  1234567 → 12,34,567
```

**Example Outputs**:
- 50: `₹50.00`
- 123456: `₹1,23,456.00`
- 12345678: `₹1.23 Crore`
- -999: `-₹999.00`

### 6.2 `utils/csvHelper.ts` - Data Serialization

**generateCSV(transactions, books, categories): string**

**CSV Format**:
```
Date,Book,Type,Category,Amount,Note,TransactionID
2023-10-25,Personal Savings,EXPENSE,Food & Dining,25.50,Lunch with team,tx-123
```

**Escaping Logic**:
```typescript
const escape = (val: string | number | undefined) => 
  `"${String(val || '').replace(/"/g, '""')}"`;
```

Wraps all fields in quotes and escapes internal quotes by doubling them. Handles commas in notes/names.

**parseCSV(csvText): any[]**

**Algorithm**:
1. Split by newlines
2. Parse header row
3. For each data row:
   - Use regex to split by comma while respecting quoted sections
   - Map values to column headers
   - Return array of objects

**Regex Pattern**: `/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g`
- Matches either: quoted string OR non-comma characters
- Lookahead asserts comma or end of line follows

### 6.3 `utils/driveService.ts` - Google Drive API

**Initialization**:
```typescript
export const initGapiClient = async () => {
  // Load Google Drive REST API client
  await gapi.load('client', ...);
  
  // Initialize with discovery doc
  await gapi.client.init({
    discoveryDocs: [DISCOVERY_DOC]
  });
};

export const initGisClient = (clientId: string, callback) => {
  // Initialize OAuth 2.0 client for browser-based flows
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,  // 'https://www.googleapis.com/auth/drive.file'
    callback: callback
  });
};
```

**File Upload**:
```typescript
export const uploadFile = async (fileName, content, mimeType) => {
  const file = new Blob([content], { type: mimeType });
  
  const metadata = { name: fileName, mimeType };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);
  
  // Use REST API endpoint (not gapi.client which is for discovery API)
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
    body: form
  });
  return await res.json();
};
```

**File Search**:
```typescript
export const findFile = async (fileName) => {
  // Query: Find non-trashed file with matching name
  const response = await gapi.client.drive.files.list({
    q: `name = '${fileName}' and trashed = false`,
    fields: 'files(id, name, createdTime)',
    spaces: 'drive'
  });
  
  return response.result.files?.[0] || null;
};
```

---

## 7. Styling & Theming

**Tailwind CSS** used throughout with:
- **Dark mode**: `dark:` prefix for dark theme variants
- **Breakpoints**: `md:`, `sm:` for responsive design
- **Color system**: 
  - Primary brand colors (probably blue-based)
  - Text colors (gray palettes)
  - Background colors (bg-white, dark:bg-cardbg)
- **Spacing**: Consistent px/py padding, gap spacing

**Custom CSS Classes** (inferred from codebase):
- `.custom-scrollbar`: Custom scroll styling
- `.dark`: Root element class for dark mode
- `.pb-safe`: Safe area padding for notched devices
- `.cardbg`, `.darkbg`: Custom dark mode colors

---

## 8. Performance Optimizations

### 8.1 Memoization
- **useMemo**: Expensive computations (filtering, reducing)
- **useCallback**: Event handlers and context actions

### 8.2 Code Splitting
- React Router enables automatic route-based code splitting
- Each page component lazy-loaded

### 8.3 Bundle Optimization
- **Tree-shaking**: Unused code removed by Vite
- **Dependencies**: Well-chosen, lightweight libraries
- **Icons**: Lucide React provides tree-shakeable SVG icons

### 8.4 Storage Optimization
- localStorage keeps data locally (no server needed)
- JSON serialization is compact for small datasets
- Could benefit from IndexedDB for larger datasets

---

## 9. Architecture Patterns Used

| Pattern | Usage | Location |
|---------|-------|----------|
| **Context API** | Global state management | DataContext, ToastContext |
| **Custom Hooks** | State logic extraction | useData(), useToast() |
| **Compound Components** | Modal + Form pattern | TransactionModal + TransactionForm |
| **Shell Layout** | Navigation structure | Layout component |
| **Error Boundary** | Error isolation | ErrorBoundary component |
| **Higher-Order Component** | Provider wrapping | App.tsx |
| **Factory Pattern** | Creating entities with IDs | addProfile, addBook, addTransaction |
| **Observer Pattern** | localStorage changes | useEffect subscriptions |
| **Strategy Pattern** | Theme application | Light/Dark/System modes |

---

## 10. Data Flow Diagrams

### Transaction Creation Flow
```
User clicks "Add Transaction"
    ↓
TransactionModal opens
    ↓
TransactionForm rendered
    ↓
User fills: amount, date, category, book, type, note
    ↓
User clicks "Submit"
    ↓
addTransaction(txData) called from DataContext
    ↓
New Transaction created with UUID + timestamp
    ↓
Prepended to transactions array
    ↓
localStorage automatically updated
    ↓
Home page re-renders with new transaction
    ↓
Balance calculations update via useMemo
    ↓
UI reflects change immediately
```

### Autopay Processing Flow
```
App mounts OR autopays state changes
    ↓
processAutopays() runs after 2s delay
    ↓
For each ACTIVE autopay:
  - Calculate if enough time has passed
  - Create Transaction with [Autopay] prefix
  - Update lastProcessedAt
    ↓
All new transactions prepended
    ↓
localStorage updated
    ↓
Home page shows new transactions
```

### Profile Switching Flow
```
User selects different profile
    ↓
switchProfile(newProfileId) called
    ↓
All profiles' isCurrent flags updated
    ↓
currentProfile derived from profiles array
    ↓
All dependent selectors re-evaluate
    ↓
Books filter by profileId
    ↓
Transactions filter by books
    ↓
Categories remain global
    ↓
UI updates with new profile's data
```

---

## 11. Known Limitations & Improvements

### Current Limitations:
1. **Monthly Autopay Calculation**: Simplistic month diff doesn't account for varying month lengths
2. **No Undo/Redo**: Deleted transactions are permanently gone
3. **No Conflict Resolution**: If syncing multiple devices to Drive, last-write-wins
4. **Local Storage Limit**: ~5-10MB limit on browsers; large datasets will fail
5. **No Data Encryption**: LocalStorage and Drive backup unencrypted
6. **Single Toast**: Only one notification at a time (queue would be better)

### Recommended Improvements:
1. **Debounce localStorage Writes**: Batch updates to reduce IO
2. **Soft Deletes**: Mark as deleted, allow recovery
3. **Conflict Resolution**: Merge strategy for multi-device sync
4. **IndexedDB Migration**: For larger datasets
5. **End-to-End Encryption**: Encrypt before uploading to Drive
6. **Toast Queue**: Allow multiple simultaneous notifications
7. **Undo Stack**: Keep transaction history for recovery
8. **Service Worker**: Offline support and background sync

---

## Summary

The ET application demonstrates solid React architecture with:
- Clean separation of concerns (components, contexts, utilities)
- Strong type safety via TypeScript
- Performance considerations (memoization, optimization)
- Cross-platform support via Capacitor
- Cloud integration ready (Google Drive)

The codebase prioritizes user experience with privacy controls, intuitive UI, and robust error handling. Data persistence ensures no loss of information, and the modular component structure allows easy feature additions.

