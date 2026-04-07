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

export interface Profile {
  id: string;
  name: string;
  icon: string; // New field
  currency: string; // New field
  isCurrent: boolean;
  themePreference: 'light' | 'dark' | 'system';
  isPrivacyMode: boolean;
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
  createdAt: number;
}

export interface DataContextType {
  profiles: Profile[];
  books: Book[];
  transactions: Transaction[];
  categories: Category[];
  currentProfile: Profile | null;
  
  // Profile Actions
  addProfile: (name: string) => void;
  switchProfile: (id: string) => void;
  updateProfileSettings: (id: string, updates: Partial<Profile>) => void;
  deleteProfile: (id: string) => void; // New action
  togglePrivacyMode: () => void;
  
  // Categories Actions
  addCategory: (category: Omit<Category, 'id'>) => void; // New action
  deleteCategory: (id: string) => void; // New action

  // Data Actions
  addBook: (book: Omit<Book, 'id' | 'profileId'>) => void;
  updateBook: (id: string, updates: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  reorderCategories: (newCategories: Category[]) => void;
  
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  resetAllData: () => void; // New action

  // Import/Export
  importData: (csvText: string) => Promise<{ success: boolean; message: string }>;
  exportData: () => void;
  downloadTemplate: () => void;

  // Drive
  initGoogleDrive: (clientId: string) => Promise<void>;
  signInToGoogle: () => Promise<void>;
  signOutFromGoogle: () => Promise<void>;
  syncWithDrive: () => Promise<void>;
  isGoogleReady: boolean;
}