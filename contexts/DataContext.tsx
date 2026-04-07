import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Profile, Book, Transaction, Category, DataContextType, 
  SyncFrequency, TransactionType 
} from '../types';
import { DEFAULT_CATEGORIES } from '../constants';
import { generateCSV, parseCSV, SAMPLE_CSV } from '../utils/csvHelper';
import * as driveService from '../utils/driveService';

// Extend Window interface to include gapi and google
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY = 'expenSync_v1';
const DRIVE_FILE_NAME = 'expenSync_backup.json';

const INITIAL_PROFILE: Profile = {
  id: 'default_profile',
  name: 'Main User',
  icon: 'User',
  currency: 'INR',
  isCurrent: true,
  themePreference: 'system',
  isPrivacyMode: false,
  syncFrequency: SyncFrequency.OFF
};

const INITIAL_BOOK: Book = {
  id: 'default_book',
  profileId: 'default_profile',
  name: 'Personal Wallet',
  currency: 'INR',
  color: 'bg-blue-500'
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  
  // Load initial data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: Ensure new fields exist on old data
      const loadedProfiles = (parsed.profiles || [INITIAL_PROFILE]).map((p: any) => ({
          ...p,
          isPrivacyMode: p.isPrivacyMode ?? false,
          icon: p.icon ?? 'User',
          currency: p.currency === 'USD' ? 'INR' : (p.currency ?? 'INR')
      }));

      const loadedBooks = (parsed.books || [INITIAL_BOOK]).map((b: any) => ({
          ...b,
          currency: b.currency === 'USD' ? 'INR' : (b.currency ?? 'INR')
      }));

      setProfiles(loadedProfiles);
      setBooks(loadedBooks);
      setTransactions(parsed.transactions || []);
      // Load categories or fallback to default
      setCategories(parsed.categories || DEFAULT_CATEGORIES);
      
      if (googleClientId && window.gapi) {
        initGoogleDrive(googleClientId);
      }
    } else {
      setProfiles([INITIAL_PROFILE]);
      setBooks([INITIAL_BOOK]);
      setTransactions([]);
      setCategories(DEFAULT_CATEGORIES);
      
      if (googleClientId && window.gapi) {
        initGoogleDrive(googleClientId);
      }
    }
  }, []);

  // Save on change
  useEffect(() => {
    if (profiles.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ profiles, books, transactions, categories }));
    }
  }, [profiles, books, transactions, categories]);

  const currentProfile = profiles.find(p => p.isCurrent) || profiles[0] || null;

  // --- Profile Actions ---

  const addProfile = useCallback((name: string) => {
    const newProfile: Profile = {
      id: uuidv4(),
      name,
      icon: 'Smile',
      currency: 'INR',
      isCurrent: true,
      themePreference: 'system',
      isPrivacyMode: false,
      syncFrequency: SyncFrequency.OFF
    };
    
    setProfiles(prev => {
      const updatedProfiles = prev.map(p => ({ ...p, isCurrent: false }));
      return [...updatedProfiles, newProfile];
    });
    
    const newBook: Book = {
      id: uuidv4(),
      profileId: newProfile.id,
      name: 'My Wallet',
      currency: 'INR',
      color: 'bg-emerald-500'
    };
    setBooks(prev => [...prev, newBook]);
  }, []);

  const switchProfile = useCallback((id: string) => {
    setProfiles(prev => prev.map(p => ({
      ...p,
      isCurrent: p.id === id
    })));
  }, []);

  const updateProfileSettings = useCallback((id: string, updates: Partial<Profile>) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deleteProfile = useCallback((id: string) => {
    setProfiles(prev => {
      if (prev.length <= 1) return prev;
      
      const isDeletingCurrent = prev.find(p => p.isCurrent)?.id === id;
      let remaining = prev.filter(p => p.id !== id);
      
      if (isDeletingCurrent && remaining.length > 0) {
        remaining = remaining.map((p, idx) => 
          idx === 0 ? { ...p, isCurrent: true } : p
        );
      }
      return remaining;
    });

    // Remove associated books and transactions
    setBooks(prev => {
      const booksToDelete = prev.filter(b => b.profileId === id).map(b => b.id);
      setTransactions(txs => txs.filter(t => !booksToDelete.includes(t.bookId)));
      return prev.filter(b => b.profileId !== id);
    });
  }, []);

  const togglePrivacyMode = useCallback(() => {
    if (currentProfile) {
        updateProfileSettings(currentProfile.id, { isPrivacyMode: !currentProfile.isPrivacyMode });
    }
  }, [currentProfile, updateProfileSettings]);

  // --- Google Drive Integration ---

  const initGoogleDrive = useCallback(async (clientId: string) => {
    try {
      if (!window.gapi || !window.google) {
        console.warn("Google API scripts not loaded");
        return;
      }
      
      await driveService.initGapiClient();
      
      driveService.initGisClient(clientId, (response) => {
        if(response.access_token && currentProfile) {
           updateProfileSettings(currentProfile.id, { googleAccessToken: response.access_token });
           driveService.setAccessToken(response.access_token);
        }
      });
      setIsGoogleReady(true);
    } catch (e) {
      console.error("Failed to init Google Drive", e);
    }
  }, [currentProfile, updateProfileSettings]);

  const signInToGoogle = useCallback(async () => {
     if(!isGoogleReady) {
       const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
       if (googleClientId) {
         await initGoogleDrive(googleClientId);
       } else {
         return;
       }
     }
     driveService.requestAccessToken();
  }, [isGoogleReady, initGoogleDrive]);

  const signOutFromGoogle = useCallback(async () => {
    if(currentProfile) {
      updateProfileSettings(currentProfile.id, { googleAccessToken: undefined });
    }
  }, [currentProfile, updateProfileSettings]);

  const syncWithDrive = useCallback(async () => {
    if (!currentProfile?.googleAccessToken) {
       await signInToGoogle();
       return; 
    }
    const data = JSON.stringify({
       profile: currentProfile,
       books: books.filter(b => b.profileId === currentProfile.id),
       transactions: transactions.filter(t => books.find(b => b.id === t.bookId)?.profileId === currentProfile.id),
       categories // include categories in sync
    });

    try {
       await driveService.uploadFile(DRIVE_FILE_NAME, data);
       updateProfileSettings(currentProfile.id, { lastSyncedAt: Date.now() });
    } catch(e) {
       console.error(e);
       throw e; // Propagate error
    }
  }, [currentProfile, books, transactions, categories, signInToGoogle, updateProfileSettings]);

  // --- Category Actions ---

  const addCategory = (categoryData: Omit<Category, 'id'>) => {
      const newCat: Category = { ...categoryData, id: `cat_${Date.now()}` };
      setCategories(prev => [...prev, newCat]);
  };

  const deleteCategory = (id: string) => {
      setCategories(prev => prev.filter(c => c.id !== id));
  };

  // --- Data Actions ---

  const addBook = (bookData: Omit<Book, 'id' | 'profileId'>) => {
    if (!currentProfile) return;
    const newBook: Book = {
      ...bookData,
      id: uuidv4(),
      profileId: currentProfile.id
    };
    setBooks(prev => [...prev, newBook]);
  };

  const updateBook = (id: string, updates: Partial<Book>) => {
      setBooks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBook = (id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
    setTransactions(prev => prev.filter(t => t.bookId !== id));
  };

  const addTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...txData,
      id: uuidv4(),
      createdAt: Date.now()
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const resetAllData = () => {
      localStorage.removeItem(STORAGE_KEY);
      setProfiles([INITIAL_PROFILE]);
      setBooks([INITIAL_BOOK]);
      setTransactions([]);
      setCategories(DEFAULT_CATEGORIES);
      window.location.reload();
  };

  // --- Import / Export ---

  const downloadTemplate = useCallback(() => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }, []);

  const exportData = useCallback(() => {
    if (!currentProfile) return;
    const profileBookIds = books.filter(b => b.profileId === currentProfile.id).map(b => b.id);
    const profileTransactions = transactions.filter(t => profileBookIds.includes(t.bookId));
    
    const csv = generateCSV(profileTransactions, books, categories);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ET_${currentProfile.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [currentProfile, books, transactions, categories]);

  const importData = async (csvText: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!currentProfile) throw new Error("No profile selected");
      const rows = parseCSV(csvText);
      const newTransactions: Transaction[] = [];
      const newBooks: Book[] = [];
      const localBooks = [...books];
      let importedCount = 0;

      for (const row of rows) {
        const bookName = row['Book'] || 'Imported Book';
        let book = localBooks.find(b => b.name === bookName && b.profileId === currentProfile.id);
        
        if (!book) {
            const newBookId = uuidv4();
            book = {
                id: newBookId,
                profileId: currentProfile.id,
                name: bookName,
                currency: currentProfile.currency || 'INR',
                color: 'bg-gray-500'
            };
            localBooks.push(book);
            newBooks.push(book);
        }

        const catName = row['Category'] || 'Uncategorized';
        const cat = categories.find(c => c.name === catName) || categories[0];
        
        if (row['Amount'] && row['Date']) {
            newTransactions.push({
                id: uuidv4(),
                bookId: book.id,
                amount: parseFloat(row['Amount']),
                type: row['Type'] === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE,
                categoryId: cat.id,
                date: row['Date'],
                note: row['Note'] || '',
                createdAt: Date.now()
            });
            importedCount++;
        }
      }

      if (newBooks.length > 0) {
        setBooks(prev => [...prev, ...newBooks]);
      }
      setTransactions(prev => [...newTransactions, ...prev]);
      
      return { success: true, message: `Successfully imported ${importedCount} transactions.` };
    } catch (e: any) {
      return { success: false, message: e.message || "Failed to import CSV" };
    }
  };

  const reorderCategories = useCallback((newCategories: Category[]) => {
      setCategories(newCategories);
  }, []);

  const value = {
    profiles,
    books,
    transactions,
    categories,
    currentProfile,
    addProfile,
    switchProfile,
    updateProfileSettings,
    deleteProfile,
    togglePrivacyMode,
    addCategory,
    deleteCategory,
    reorderCategories,
    addBook,
    updateBook,
    deleteBook,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    resetAllData,
    importData,
    exportData,
    downloadTemplate,
    initGoogleDrive,
    signInToGoogle,
    signOutFromGoogle,
    syncWithDrive,
    isGoogleReady
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};