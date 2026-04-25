import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { NativeBiometric } from 'capacitor-native-biometric';
import { 
  Profile, Book, Transaction, Category, DataContextType, 
  SyncFrequency, TransactionType, Autopay, AutopayFrequency 
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
const TAGS_STORAGE_KEY = 'expenSync_tags_v1';
const DRIVE_FILE_NAME = 'expenSync_backup.json';

const INITIAL_PROFILE: Profile = {
  id: 'default_profile',
  name: 'Main User',
  icon: 'User',
  currency: 'INR',
  isCurrent: true,
  themePreference: 'system',
  isPrivacyMode: false,
  isSecurityEnabled: false,
  isBiometricEnabled: false,
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
  const [autopays, setAutopays] = useState<Autopay[]>([]);
  const [tagHistory, setTagHistory] = useState<string[]>([]);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  
  // Load initial data
  useEffect(() => {
    // Check biometric support
    const checkBiometricSupport = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const result = await NativeBiometric.isAvailable();
          setIsBiometricSupported(result.isAvailable);
        } catch (err) {
          console.error('Native biometric support check failed:', err);
          setIsBiometricSupported(false);
        }
      } else if (window.PublicKeyCredential) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsBiometricSupported(available);
        } catch (err) {
          setIsBiometricSupported(false);
        }
      }
    };
    
    checkBiometricSupport();

    const saved = localStorage.getItem(STORAGE_KEY);
    const savedTags = localStorage.getItem(TAGS_STORAGE_KEY);
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (savedTags) {
      setTagHistory(JSON.parse(savedTags));
    }

    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: Ensure new fields exist on old data
      const loadedProfiles = (parsed.profiles || [INITIAL_PROFILE]).map((p: any) => ({
          ...p,
          isPrivacyMode: p.isPrivacyMode ?? false,
          isSecurityEnabled: p.isSecurityEnabled ?? false,
          isBiometricEnabled: p.isBiometricEnabled ?? false,
          icon: p.icon ?? 'User',
          currency: p.currency === 'USD' ? 'INR' : (p.currency ?? 'INR'),
          selectedBookIds: p.selectedBookIds ?? (parsed.books || [INITIAL_BOOK])
            .filter((b: any) => b.profileId === p.id)
            .map((b: any) => b.id)
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
      setAutopays(parsed.autopays || []);
      
      const current = loadedProfiles.find((p: any) => p.isCurrent) || loadedProfiles[0];
      if (current?.isSecurityEnabled) {
        setIsAppLocked(true);
      }

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
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ profiles, books, transactions, categories, autopays }));
    }
  }, [profiles, books, transactions, categories, autopays]);

  useEffect(() => {
    localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tagHistory));
  }, [tagHistory]);

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
      isSecurityEnabled: false,
      isBiometricEnabled: false,
      selectedBookIds: [],
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
    newProfile.selectedBookIds = [newBook.id];
    setBooks(prev => [...prev, newBook]);
  }, []);

  const switchProfile = useCallback((id: string) => {
    setProfiles(prev => {
      const updated = prev.map(p => ({
        ...p,
        isCurrent: p.id === id
      }));
      
      const newCurrent = updated.find(p => p.id === id);
      if (newCurrent?.isSecurityEnabled) {
        setIsAppLocked(true);
      } else {
        setIsAppLocked(false);
      }
      
      return updated;
    });
  }, []);

  const updateProfileSettings = useCallback((id: string, updates: Partial<Profile>) => {
    setProfiles(prev => prev.map(p => {
      if (p.id === id) {
        const updatedProfile = { ...p, ...updates };
        
        // If currency changed, filter selectedBookIds to only include books with the new currency
        if (updates.currency && updates.currency !== p.currency) {
          const profileBooks = books.filter(b => b.profileId === id);
          updatedProfile.selectedBookIds = (p.selectedBookIds || []).filter(bookId => {
            const book = profileBooks.find(b => b.id === bookId);
            return book?.currency === updates.currency;
          });
        }
        
        return updatedProfile;
      }
      return p;
    }));
  }, [books]);

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

  const unlockApp = useCallback((pin: string) => {
    if (!currentProfile || !currentProfile.securityPin) return true;
    if (currentProfile.securityPin === pin) {
      setIsAppLocked(false);
      return true;
    }
    return false;
  }, [currentProfile]);

  const lockApp = useCallback(() => {
    if (currentProfile?.isSecurityEnabled) {
      setIsAppLocked(true);
    }
  }, [currentProfile]);

  const setAppPin = useCallback((pin: string) => {
    if (currentProfile) {
      updateProfileSettings(currentProfile.id, { 
        isSecurityEnabled: true, 
        securityPin: pin 
      });
    }
  }, [currentProfile, updateProfileSettings]);

  const unlockWithoutPin = useCallback(() => {
    setIsAppLocked(false);
  }, []);

  const disableAppPin = useCallback(() => {
    if (currentProfile) {
      updateProfileSettings(currentProfile.id, { 
        isSecurityEnabled: false, 
        securityPin: undefined,
        isBiometricEnabled: false
      });
      setIsAppLocked(false);
    }
  }, [currentProfile, updateProfileSettings]);

  const toggleBiometric = useCallback(async () => {
    if (!currentProfile) return false;
    
    const newState = !currentProfile.isBiometricEnabled;
    
    // For web environments, enabling biometrics usually requires a simple user gesture verification 
    // but here we just toggle the setting for the UI flow.
    updateProfileSettings(currentProfile.id, { isBiometricEnabled: newState });
    return newState;
  }, [currentProfile, updateProfileSettings]);

  const toggleBookSelection = useCallback((bookId: string) => {
    if (!currentProfile) return;
    
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    // Prevent selecting books with mismatched currency
    if (book.currency !== currentProfile.currency) {
      return;
    }

    const currentSelected = currentProfile.selectedBookIds || [];
    const isSelected = currentSelected.includes(bookId);
    
    const newSelected = isSelected 
      ? currentSelected.filter(id => id !== bookId)
      : [...currentSelected, bookId];
      
    updateProfileSettings(currentProfile.id, { selectedBookIds: newSelected });
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
      setCategories(prev => {
        const othersIndex = prev.findIndex(c => c.id === 'cat_other');
        if (othersIndex === -1) return [...prev, newCat];
        
        const updated = [...prev];
        updated.splice(othersIndex, 0, newCat);
        return updated;
      });
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
      setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCategory = (id: string) => {
      if (id === 'cat_other') return; // Cannot delete the default category
      
      // Re-assign transactions to 'Others'
      setTransactions(prev => prev.map(t => 
          t.categoryId === id ? { ...t, categoryId: 'cat_other' } : t
      ));
      
      setCategories(prev => prev.filter(c => c.id !== id));
  };

  const isCategoryUsed = useCallback((id: string) => {
      return transactions.some(t => t.categoryId === id);
  }, [transactions]);

  // --- Tag Actions ---

  const addTagsToHistory = useCallback((tags: string[]) => {
    if (!tags || tags.length === 0) return;
    setTagHistory(prev => {
      const newTags = tags.filter(tag => !prev.includes(tag));
      if (newTags.length === 0) return prev;
      return [...newTags, ...prev].slice(0, 50); // Keep last 50 unique tags
    });
  }, []);

  const removeFromTagHistory = useCallback((tag: string) => {
    setTagHistory(prev => prev.filter(t => t !== tag));
  }, []);

  // --- Data Actions ---

  const addBook = (bookData: Omit<Book, 'id' | 'profileId'>) => {
    if (!currentProfile) return;
    const newBookId = uuidv4();
    const newBook: Book = {
      ...bookData,
      id: newBookId,
      profileId: currentProfile.id
    };
    setBooks(prev => [...prev, newBook]);
    
    // Auto-select new book only if currency matches
    if (newBook.currency === currentProfile.currency) {
      const currentSelected = currentProfile.selectedBookIds || [];
      updateProfileSettings(currentProfile.id, { 
        selectedBookIds: [...currentSelected, newBookId] 
      });
    }
  };

  const updateBook = (id: string, updates: Partial<Book>) => {
      setBooks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBook = (id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
    setTransactions(prev => prev.filter(t => t.bookId !== id));
    setAutopays(prev => prev.filter(a => a.bookId !== id));
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

  // --- Autopay Actions ---

  const addAutopay = (autopayData: Omit<Autopay, 'id' | 'status' | 'lastProcessedAt'>) => {
    const newAutopay: Autopay = {
      ...autopayData,
      id: uuidv4(),
      status: 'ACTIVE',
      lastProcessedAt: undefined
    };
    setAutopays(prev => [...prev, newAutopay]);
  };

  const updateAutopay = (id: string, updates: Partial<Autopay>) => {
    setAutopays(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteAutopay = (id: string) => {
    setAutopays(prev => prev.filter(a => a.id !== id));
  };

  const toggleAutopayStatus = (id: string) => {
    setAutopays(prev => prev.map(a => 
      a.id === id ? { ...a, status: a.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : a
    ));
  };

  const processAutopays = useCallback(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const newTransactions: Transaction[] = [];
    const updatedAutopays = [...autopays];

    let changed = false;

    updatedAutopays.forEach((ap, index) => {
      if (ap.status !== 'ACTIVE') return;

      const [year, month, day] = ap.startDate.split('-').map(Number);
      const [hours, minutes] = (ap.startTime || '00:00').split(':').map(Number);
      const startDateTime = new Date(year, month - 1, day, hours, minutes);
      
      if (startDateTime > now) return;

      let lastDate = ap.lastProcessedAt ? new Date(ap.lastProcessedAt) : startDateTime;
      
      let shouldProcess = false;
      if (!ap.lastProcessedAt) {
        shouldProcess = true;
      } else {
        const diffMs = now.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (ap.frequency === AutopayFrequency.DAILY && diffDays >= 1) {
          shouldProcess = true;
        } else if (ap.frequency === AutopayFrequency.WEEKLY && diffDays >= 7) {
          shouldProcess = true;
        } else if (ap.frequency === AutopayFrequency.BI_WEEKLY && diffDays >= 14) {
          shouldProcess = true;
        } else if (ap.frequency === AutopayFrequency.MONTHLY) {
          const monthsDiff = (now.getFullYear() - lastDate.getFullYear()) * 12 + (now.getMonth() - lastDate.getMonth());
          if (monthsDiff >= 1) {
            shouldProcess = true;
          }
        } else if (ap.frequency === AutopayFrequency.BI_MONTHLY) {
          const monthsDiff = (now.getFullYear() - lastDate.getFullYear()) * 12 + (now.getMonth() - lastDate.getMonth());
          if (monthsDiff >= 2) {
            shouldProcess = true;
          }
        } else if (ap.frequency === AutopayFrequency.QUARTERLY) {
          const monthsDiff = (now.getFullYear() - lastDate.getFullYear()) * 12 + (now.getMonth() - lastDate.getMonth());
          if (monthsDiff >= 3) {
            shouldProcess = true;
          }
        } else if (ap.frequency === AutopayFrequency.HALF_YEARLY) {
          const monthsDiff = (now.getFullYear() - lastDate.getFullYear()) * 12 + (now.getMonth() - lastDate.getMonth());
          if (monthsDiff >= 6) {
            shouldProcess = true;
          }
        } else if (ap.frequency === AutopayFrequency.YEARLY) {
          const yearsDiff = now.getFullYear() - lastDate.getFullYear();
          if (yearsDiff >= 1 && (now.getMonth() > lastDate.getMonth() || (now.getMonth() === lastDate.getMonth() && now.getDate() >= lastDate.getDate()))) {
            shouldProcess = true;
          }
        }
      }

      if (shouldProcess) {
        const tx: Transaction = {
          id: uuidv4(),
          bookId: ap.bookId,
          amount: ap.amount,
          type: ap.type,
          categoryId: ap.categoryId,
          date: todayStr,
          note: `[Autopay] ${ap.note || ''}`,
          tags: ap.tags,
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

  // Run autopay processing on mount and when autopays change (but carefully)
  useEffect(() => {
    const timer = setTimeout(() => {
      processAutopays();
    }, 2000); // Delay a bit to ensure data is loaded
    return () => clearTimeout(timer);
  }, [processAutopays]);

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
    const fileName = 'expenses_template.csv';
    
    if (Capacitor.isNativePlatform()) {
      const handleNativeDownload = async () => {
        try {
          // Save to cache directory
          const result = await Filesystem.writeFile({
            path: fileName,
            data: SAMPLE_CSV,
            directory: Directory.Cache,
            encoding: 'utf8' as any, // Filesystem encoding type
          });

          // Share the file
          await Share.share({
            title: 'Download Template',
            text: 'Here is the import template',
            files: [result.uri],
            dialogTitle: 'Save Template',
          });
        } catch (error) {
          console.error('Download failed:', error);
          alert('Download failed. Please check permissions.');
        }
      };
      handleNativeDownload();
    } else {
      const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }, []);

  const exportData = useCallback(() => {
    if (!currentProfile) return;
    const profileBookIds = books.filter(b => b.profileId === currentProfile.id).map(b => b.id);
    const profileTransactions = transactions.filter(t => profileBookIds.includes(t.bookId));
    
    // Prepare data for Excel
    const data = profileTransactions.map(tx => {
      const book = books.find(b => b.id === tx.bookId);
      const category = categories.find(c => c.id === tx.categoryId);
      return {
        'Date': new Date(tx.date).toISOString().split('T')[0],
        'Time': tx.time || '',
        'Book': book?.name || 'Unknown Book',
        'Type': tx.type,
        'Category': category?.name || 'Uncategorized',
        'Amount': tx.amount,
        'Note': tx.note || '',
        'Tags': tx.tags ? tx.tags.join('|') : '',
        'TransactionID': tx.id
      };
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");

    // Generate Excel file and trigger download
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileName = `ET_${currentProfile.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

    if (Capacitor.isNativePlatform()) {
      // Native Export (Android/iOS)
      const handleNativeExport = async () => {
        try {
          const base64Data = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
          
          // Save to temporary directory
          const result = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache,
          });

          // Share the file
          await Share.share({
            title: 'Export Transactions',
            text: 'Here is your transaction export',
            files: [result.uri],
            dialogTitle: 'Share Export',
          });
        } catch (error) {
          console.error('Export failed:', error);
          alert('Export failed. Please check permissions.');
        }
      };
      
      handleNativeExport();
    } else {
      // Browser Export
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }, [currentProfile, books, transactions, categories]);

  const importData = async (input: string | any[]): Promise<{ success: boolean; message: string }> => {
    try {
      if (!currentProfile) throw new Error("No profile selected");
      
      let rows: any[] = [];
      if (typeof input === 'string') {
        rows = parseCSV(input);
      } else {
        rows = input;
      }

      const newTransactions: Transaction[] = [];
      const newBooks: Book[] = [];
      const localBooks = [...books];
      const localCategories = [...categories];
      const newlyCreatedCategories: Category[] = [];
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
        let cat = localCategories.find(c => c.name.toLowerCase() === catName.toLowerCase());
        
        // If category doesn't exist, create it!
        if (!cat) {
            cat = {
                id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: catName,
                icon: 'Layers', // Default icon for new categories
                color: 'text-gray-500' // Default color
            };
            localCategories.push(cat);
            newlyCreatedCategories.push(cat);
        }

        if (row['Amount'] && row['Date']) {
            const tags = row['Tags'] ? row['Tags'].split('|').filter(Boolean) : [];
            newTransactions.push({
                id: uuidv4(),
                bookId: book.id,
                amount: parseFloat(row['Amount']),
                type: row['Type'] === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE,
                categoryId: cat.id,
                date: row['Date'],
                time: row['Time'] || undefined,
                note: row['Note'] || '',
                tags: tags.length > 0 ? tags : undefined,
                createdAt: Date.now()
            });
            
            if (tags.length > 0) {
              addTagsToHistory(tags);
            }
            importedCount++;
        }
      }

      if (newBooks.length > 0) {
        setBooks(prev => [...prev, ...newBooks]);
      }
      
      if (newlyCreatedCategories.length > 0) {
        setCategories(prev => [...prev, ...newlyCreatedCategories]);
      }

      setTransactions(prev => [...newTransactions, ...prev]);
      
      return { success: true, message: `Successfully imported ${importedCount} transactions.` };
    } catch (e: any) {
      return { success: false, message: e.message || "Failed to import data" };
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
    autopays,
    currentProfile,
    tagHistory,
    addProfile,
    switchProfile,
    updateProfileSettings,
    deleteProfile,
    togglePrivacyMode,
    toggleBookSelection,
    addCategory,
    updateCategory,
    deleteCategory,
    isCategoryUsed,
    addTagsToHistory,
    removeFromTagHistory,
    reorderCategories,
    addBook,
    updateBook,
    deleteBook,
    addAutopay,
    updateAutopay,
    deleteAutopay,
    toggleAutopayStatus,
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
    isGoogleReady,
    isAppLocked,
    unlockApp,
    lockApp,
    setAppPin,
    disableAppPin,
    unlockWithoutPin,
    toggleBiometric,
    isBiometricSupported
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};