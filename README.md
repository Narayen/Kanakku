# ET - Expense Tracking Application

A comprehensive, cross-platform expense tracking application built with React, TypeScript, and Capacitor. Supports multiple profiles, books (wallets), categories, automatic recurring payments, and seamless Google Drive integration for backup and synchronization.

## 🎯 Project Overview

**ET (Expense Tracker)** is a full-featured personal finance management application designed for:
- **Multi-Profile Support**: Create and manage multiple expense tracking profiles for different purposes (personal, household, business, etc.)
- **Multiple Books/Wallets**: Organize transactions across multiple books with different currencies
- **Smart Transaction Management**: Track income and expenses with detailed categorization
- **Automated Recurring Payments**: Set up autopay rules for recurring monthly/weekly/daily expenses
- **Cross-Platform Deployment**: Run on web, iOS, and Android via Capacitor
- **Privacy First**: Privacy mode to mask all monetary values on screen
- **Cloud Synchronization**: Backup and sync data to Google Drive
- **CSV Import/Export**: Import transactions from CSV files or export your data
- **Analytics Dashboard**: Visual representation of income, expenses, and trends via Recharts

### Technology Stack
- **Frontend Framework**: React 19.2.3 with TypeScript 5.8.2
- **State Management**: React Context API (DataContext, ToastContext)
- **Routing**: React Router v7.12.0
- **Build Tool**: Vite 6.2.0
- **Mobile Framework**: Capacitor 8.3.0 (Android, iOS)
- **UI Components**: Lucide React icons
- **Charts**: Recharts 3.6.0
- **Data Format**: XLSX 0.18.5 for Excel support
- **Styling**: Tailwind CSS (inferred from class usage)

## 📂 Project Structure

```
ET/
├── App.tsx                          # Main app component with routing setup
├── index.tsx                        # React entry point
├── types.ts                         # TypeScript interfaces and enums
├── constants.ts                     # Default categories, colors, currencies
├── capacitor.config.ts              # Capacitor mobile config
├── vite.config.ts                   # Vite build configuration
│
├── components/
│   ├── Layout.tsx                   # Main layout with navigation
│   ├── TransactionForm.tsx          # Form for adding/editing transactions
│   ├── TransactionModal.tsx         # Modal wrapper for transaction form
│   ├── AutopayModal.tsx             # Modal for autopay setup
│   └── ErrorBoundary.tsx            # Error boundary wrapper
│
├── pages/
│   ├── Home.tsx                     # Dashboard with balance overview
│   ├── Books.tsx                    # Book management page
│   ├── Analytics.tsx                # Charts and analytics
│   └── Settings.tsx                 # Settings and profile management
│
├── contexts/
│   ├── DataContext.tsx              # Global data management & business logic
│   └── ToastContext.tsx             # Toast notifications system
│
├── utils/
│   ├── csvHelper.ts                 # CSV parsing and generation
│   ├── driveService.ts              # Google Drive API wrapper
│   └── format.ts                    # Currency formatting utilities
│
├── android/                         # Android native build files
└── assets/                          # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 22+ (recommended)
- npm or yarn
- For Android development: Java 21, Android SDK
- For iOS development: Xcode (Mac only)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ET
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env.local in project root
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

4. **Run locally**
   ```bash
   npm run dev
   ```
   - Web app runs at `http://localhost:3000`

### Build & Deploy

**Web Build**
```bash
npm run build          # Creates optimized production build in dist/
npm run preview        # Preview production build locally
```

**Android Build**
```bash
npx cap sync android   # Sync web assets to Android project
cd android
./gradlew assembleDebug  # Build debug APK
```

**Linting**
```bash
npm run lint           # Run TypeScript type checking
```

## 📖 Key Features Explained

### 1. Multi-Profile System
Each profile represents a distinct user with their own:
- Books/Wallets
- Transactions
- Categories
- Settings (theme, currency, privacy mode)
- Google Drive sync settings

### 2. Books & Transactions
- **Books**: Virtual wallets with distinct currencies for organizing money (e.g., "Salary Account" in USD, "Daily Expenses" in INR)
- **Transactions**: Income or expense entries with date, category, amount, and notes
- Smart filtering: Only show transactions from selected books matching the profile's currency

### 3. Categories System
- 7 default categories (Food & Dining, Transportation, Utilities, Shopping, Health, Salary, Others)
- Custom category creation with icon and color support
- Prevent category deletion if they contain transactions
- Auto-migration of transactions to "Others" category when deleting

### 4. Autopay (Recurring Payments)
Automate recurring expenses:
- Set frequency (Daily, Weekly, Monthly)
- Define start date and optional time
- Automatically creates transactions on schedule
- Pause/resume capability
- Track last processing time to avoid duplicates

### 5. Privacy Mode
Toggle to mask all monetary values on screen (displays "****" instead of amounts)

### 6. Google Drive Integration
- Backup entire profile data (profile, books, transactions, categories) to Google Drive
- OAuth 2.0 authentication via Google Sign-In
- Supports IMMEDIATE, DAILY, and MONTHLY sync frequencies

### 7. Import/Export
- Export transactions to CSV format
- Download sample CSV template
- Native file sharing on mobile via Capacitor
- Browser download on web

## 🛠️ Core Logic Explanation

### Data Flow Architecture

```
Components (Pages/Modals)
        ↓
React Router (Navigation)
        ↓
DataContext (Global State)
        ↓
LocalStorage (Persistence)
        ↓
Google Drive (Cloud Backup)
```

### DataContext Responsibilities
The [DataContext.tsx](contexts/DataContext.tsx) file is the heart of the application:

1. **State Management**: Manages profiles, books, transactions, categories, autopays
2. **Local Storage**: Auto-saves state to localStorage with key `expenSync_v1`
3. **Data Migration**: Upgrades old data format to new format on load
4. **Business Logic**:
   - Currency conversion handling
   - Book selection filtering by currency
   - Autopay processing with date calculations
   - Transaction aggregation and balance calculation
5. **Google Drive Sync**: Handles authentication and backup operations
6. **CSV Operations**: Import/export functionality for data portability

### Component Relationships

**App.tsx** → Wraps app with providers (ErrorBoundary, ToastProvider, DataProvider) and sets up routing

**Layout.tsx** → Main navigation container:
- Top header showing current profile
- Bottom navigation (mobile) / side navigation (desktop) with Home, Books, Analytics, Settings
- Uses React Router Outlet for page content

**Home.tsx** → Dashboard page:
- Shows current balance from selected books
- Lists recent transactions
- Quick add transaction button
- Privacy mode toggle
- Book balance cards

**Books.tsx** → Book management:
- Create new books with custom currency
- Select/deselect books for balance calculation
- View book details
- Edit book names/colors
- Delete books

**Analytics.tsx** → Visualization:
- Income vs Expense breakdown (Bar/Pie charts)
- Category-wise spending distribution
- Monthly trends
- Built with Recharts library

**Settings.tsx** → Profile & app configuration:
- Create/switch between profiles
- Update profile name, icon, currency, theme
- Category management (add/delete custom categories)
- Google Drive sync setup
- Privacy mode enable/disable
- Data export
- Reset all data option

### Theme System
- System preference detection using CSS media queries
- Dark mode using Tailwind CSS `dark` class
- Applied at root HTML element level
- Controlled via [DataContext.tsx](contexts/DataContext.tsx) `ThemeController` component

### Currency Formatting
[utils/format.ts](utils/format.ts) provides `formatIndianCurrency()`:
- Formats numbers using Indian numbering system (Lakh/Crore)
- Example: 1234567 → "₹12.35 Lakh"
- Handles negative values with sign prefix
- Accepts custom currency symbols

## 📊 GitHub Actions Workflows

### 1. Deploy to GitHub Pages ([.github/workflows/deploy.yml](.github/workflows/deploy.yml))
Automatically deploys web app to GitHub Pages on push to main branch:
- Checkout code
- Setup Node.js 22
- Install dependencies
- Build with Vite (includes GEMINI_API_KEY from secrets)
- Upload build artifact
- Deploy to GitHub Pages

### 2. Build Android APK ([.github/workflows/android-build.yml](.github/workflows/android-build.yml))
Builds Android APK on push to main branch:
- Checkout code
- Setup Node.js 22 with npm cache
- Install dependencies
- Build web app (Vite)
- Setup Java 21 (Zulu distribution)
- Setup Android SDK
- Sync Capacitor files to Android project
- Fix Gradle wrapper
- Build debug APK
- Upload APK artifact for download

## 🔐 Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `VITE_GEMINI_API_KEY` | Gemini API key for AI features | Optional |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID for Drive integration | Optional |

Store in `.env.local` for local development, or set as GitHub Secrets for CI/CD.

## 💾 Data Storage

### Local Storage
- Key: `expenSync_v1`
- Contains: profiles, books, transactions, categories, autopays
- Format: JSON
- Persists across browser sessions

### Data Structure
```json
{
  "profiles": [Profile],
  "books": [Book],
  "transactions": [Transaction],
  "categories": [Category],
  "autopays": [Autopay]
}
```

See [types.ts](types.ts) for complete interface definitions.

## 🔄 State Updates & Performance

- **useMemo Optimization**: Heavy computations (filtered transactions, balance calculations) are memoized
- **useCallback Optimization**: Context actions are wrapped to prevent unnecessary re-renders
- **Auto-save on Changes**: Whenever state updates, localStorage is automatically updated
- **Autopay Processing**: Runs on app mount with 2000ms delay to allow data loading

## 🎨 UI/UX Design

- **Mobile-First**: Fixed bottom navigation on mobile, sticky header on desktop
- **Dark Mode Support**: Full dark theme support with system preference detection
- **Responsive Layout**: Max-width containers with responsive padding
- **Accessibility**: Semantic HTML, icon labels, proper color contrast
- **Animations**: Smooth transitions for modals and navigation
- **Toast Notifications**: Non-blocking feedback for user actions

## 📱 Mobile Development

### Capacitor Plugins Used
- **@capacitor/filesystem**: Read/write files on native device
- **@capacitor/share**: Native share dialogs
- **@capacitor/core**: Base platform APIs

### Native Configuration
- App ID: `com.narayen.expensync`
- App Name: `ET`
- Web Directory: `dist` (auto-synced to native projects)

## 🐛 Error Handling

- **ErrorBoundary Component**: Catches React component errors
- **Try-catch Blocks**: Google Drive API and file operations
- **Migration Logic**: Auto-upgrades old data format
- **Fallback Values**: Default categories and profiles if data is corrupted

## 📈 Performance Metrics

- **Bundle Size**: Optimized with Vite tree-shaking
- **Load Time**: Cached npm dependencies in GitHub Actions
- **Rendering**: Memoized computations prevent unnecessary re-renders
- **Storage**: Efficient JSON serialization in localStorage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/YourFeature`
3. Commit changes: `git commit -m 'Add YourFeature'`
4. Push to branch: `git push origin feature/YourFeature`
5. Open a Pull Request

## 📄 License

This project is private. All rights reserved.

## 📞 Support

For issues or feature requests, please open a GitHub Issue in the repository.

---

## Additional Resources

- **Capacitor Documentation**: https://capacitorjs.com/docs
- **React Documentation**: https://react.dev
- **TypeScript Documentation**: https://www.typescriptlang.org/docs
- **Vite Documentation**: https://vitejs.dev
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev
