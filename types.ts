export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum SyncFrequency {
  IMMEDIATE = 'IMMEDIATE',
  DAILY = 'DAILY',
  MONTHLY = 'MONTHLY',
  OFF = 'OFF',
}

export enum AutopayFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export interface Profile {
  id: string;
  name: string;
  icon: string; // New field
  currency: string; // New field
  isCurrent: boolean;
  themePreference: 'light' | 'dark' | 'system';
  isPrivacyMode: boolean;
  selectedBookIds?: string[]; // IDs of books selected for balance calculation
  syncFrequency: SyncFrequency;
  googleAccessToken?: string;
  lastSyncedAt?: number;
}

export interface Book {
  id: string;
  profileId: string;
  name: string;
  currency: string;
  description?: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  bookId: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string;
  note?: string;
  tags?: string[];
  createdAt: number;
}

export interface Autopay {
  id: string;
  bookId: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  note?: string;
  tags?: string[];
  frequency: AutopayFrequency;
  status: 'ACTIVE' | 'PAUSED';
  startDate: string;
  startTime?: string;
  lastProcessedAt?: number;
}

export interface DataContextType {
  profiles: Profile[];
  books: Book[];
  transactions: Transaction[];
  categories: Category[];
  autopays: Autopay[];
  currentProfile: Profile | null;
  tagHistory: string[];
  
  // Profile Actions
  addProfile: (name: string) => void;
  switchProfile: (id: string) => void;
  updateProfileSettings: (id: string, updates: Partial<Profile>) => void;
  deleteProfile: (id: string) => void; // New action
  togglePrivacyMode: () => void;
  toggleBookSelection: (bookId: string) => void;
  
  // Categories Actions
  addCategory: (category: Omit<Category, 'id'>) => void; // New action
  deleteCategory: (id: string) => void; // New action
  isCategoryUsed: (id: string) => boolean;

  // Tag Actions
  addTagsToHistory: (tags: string[]) => void;
  removeFromTagHistory: (tag: string) => void;

  // Data Actions
  addBook: (book: Omit<Book, 'id' | 'profileId'>) => void;
  updateBook: (id: string, updates: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  reorderCategories: (newCategories: Category[]) => void;
  
  // Autopay Actions
  addAutopay: (autopay: Omit<Autopay, 'id' | 'status' | 'lastProcessedAt'>) => void;
  updateAutopay: (id: string, updates: Partial<Autopay>) => void;
  deleteAutopay: (id: string) => void;
  toggleAutopayStatus: (id: string) => void;
  
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  resetAllData: () => void; // New action

  // Import/Export
  importData: (input: string | any[]) => Promise<{ success: boolean; message: string }>;
  exportData: () => void;
  downloadTemplate: () => void;

  // Drive
  initGoogleDrive: (clientId: string) => Promise<void>;
  signInToGoogle: () => Promise<void>;
  signOutFromGoogle: () => Promise<void>;
  syncWithDrive: () => Promise<void>;
  isGoogleReady: boolean;
}