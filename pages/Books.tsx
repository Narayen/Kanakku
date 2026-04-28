import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { Plus, FolderOpen, ArrowLeft, Trash2, AlertTriangle, Pencil, TrendingUp, TrendingDown, AlertCircle, CircleHelp, Repeat, Play, Pause } from 'lucide-react';
import TransactionModal from '../components/TransactionModal';
import AutopayModal from '../components/AutopayModal';
import { TransactionType, Transaction, Autopay } from '../types';
import { CURRENCIES } from '../constants';
import { useSearchParams } from 'react-router-dom';
import { formatIndianCurrency } from '../utils/format';
import * as Icons from 'lucide-react';

const Books: React.FC = () => {
  const { 
    currentProfile, books, transactions, addBook, updateBook, deleteBook, 
    deleteTransaction, deleteTransactions, categories, autopays, toggleAutopayStatus, deleteAutopay 
  } = useData();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  // Multi-select state
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Pagination state
  const [visibleCount, setVisibleCount] = useState(30);

  const isPrivacy = currentProfile?.isPrivacyMode || false;

  const maskMoney = (amount: number, symbol?: string) => {
    if (isPrivacy) return '****';
    return formatIndianCurrency(amount, symbol || '₹');
  };

  // Sync selectedBookId with search params
  useEffect(() => {
    const id = searchParams.get('id');
    if (id && books.some(b => b.id === id)) {
      setSelectedBookId(id);
    }
  }, [searchParams, books]);
  
  // Modal States
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isAutopayModalOpen, setIsAutopayModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingAutopay, setEditingAutopay] = useState<Autopay | null>(null);
  const [confirmDeleteTxId, setConfirmDeleteTxId] = useState<string | null>(null);
  
  // Book Form State (Create & Edit)
  const [isBookFormOpen, setIsBookFormOpen] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null); // If set, we are editing
  const [bookName, setBookName] = useState('');
  const [bookCurrency, setBookCurrency] = useState('INR');

  // For delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const myBooks = books.filter(b => b.profileId === currentProfile?.id);

  const openBookForm = (bookToEdit?: typeof books[0]) => {
     if(bookToEdit) {
         setEditingBookId(bookToEdit.id);
         setBookName(bookToEdit.name);
         setBookCurrency(bookToEdit.currency);
     } else {
         setEditingBookId(null);
         setBookName('');
         setBookCurrency('INR');
     }
     setIsBookFormOpen(true);
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bookName) {
      if(editingBookId) {
          updateBook(editingBookId, { name: bookName, currency: bookCurrency });
          showToast("Book updated successfully", "success");
      } else {
          addBook({ name: bookName, currency: bookCurrency, color: 'bg-blue-500' });
          showToast("Book created successfully", "success");
      }
      setIsBookFormOpen(false);
      setEditingBookId(null);
      setBookName('');
    }
  };

  const handleEditTransaction = (tx: Transaction) => {
      setEditingTransaction(tx);
      setIsAddTxOpen(true);
  };

  const selectedBook = books.find(b => b.id === selectedBookId);

  const allBookTransactions = useMemo(() => {
    return transactions
      .filter(t => t.bookId === selectedBookId)
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        if (dateB !== dateA) return dateB - dateA;
        // If dates are equal, sort by time (desc)
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeB.localeCompare(timeA);
      });
  }, [transactions, selectedBookId]);

  const bookTransactions = useMemo(() => {
    return allBookTransactions.slice(0, visibleCount);
  }, [allBookTransactions, visibleCount]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    bookTransactions.forEach(tx => {
      // Extract date part YYYY-MM-DD
      const datePart = tx.date.split('T')[0];
      if (!groups[datePart]) {
        groups[datePart] = [];
      }
      groups[datePart].push(tx);
    });
    return groups;
  }, [bookTransactions]);

  const bookStats = useMemo(() => {
    const income = allBookTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, t) => acc + t.amount, 0);
    const expense = allBookTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, t) => acc + t.amount, 0);
    return { income, expense, total: income - expense };
  }, [allBookTransactions]);

  // Reset states
  const handleBack = () => {
    setSelectedBookId(null);
    setSearchParams({});
    setShowDeleteConfirm(false);
    setConfirmDeleteTxId(null);
    setIsMultiSelectMode(false);
    setSelectedTxIds(new Set());
    setVisibleCount(30);
  };

  const handleToggleSelectTx = (id: string) => {
    const next = new Set(selectedTxIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedTxIds(next);
  };

  const handleBulkDelete = () => {
    if (selectedTxIds.size > 0) {
      deleteTransactions(Array.from(selectedTxIds));
      showToast(`${selectedTxIds.size} transactions deleted`, "info");
      setSelectedTxIds(new Set());
      setIsMultiSelectMode(false);
    }
  };

  const handleDeleteBook = () => {
    if (selectedBookId) {
      deleteBook(selectedBookId);
      showToast("Book deleted", "info");
      handleBack();
    }
  };

  // Book Detail View
  if (selectedBookId && selectedBook) {
    const total = bookTransactions.reduce((acc, t) => {
        return t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount;
    }, 0);

    const currencySymbol = CURRENCIES.find(c => c.code === selectedBook.currency)?.symbol || '₹';

    return (
      <div className="animate-fade-in pb-10 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 py-2">
          <button 
            onClick={handleBack} 
            className="p-2 bg-white dark:bg-cardbg shadow-sm border border-gray-100 dark:border-gray-800 rounded-xl text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex-1">
             <div className="flex items-center gap-2">
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{selectedBook.name}</h2>
                 <button 
                    onClick={() => openBookForm(selectedBook)}
                    className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                 >
                     <Pencil size={14} />
                 </button>
             </div>
             <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-widest">Book Details</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-cardbg p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                <TrendingUp size={14} />
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Income</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {maskMoney(bookStats.income, currencySymbol)}
            </p>
          </div>
          <div className="bg-white dark:bg-cardbg p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                <TrendingDown size={14} />
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Expense</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {maskMoney(bookStats.expense, currencySymbol)}
            </p>
          </div>
        </div>

        {/* Total Balance Tile */}
        <div className="bg-white dark:bg-cardbg p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden">
            <h2 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Current Balance</h2>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {maskMoney(bookStats.total, currencySymbol)}
            </h1>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl"></div>
        </div>

        {/* Autopay Section */}
        <div className="bg-white dark:bg-cardbg rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-primary-50/30 dark:bg-primary-900/10">
                <div className="flex items-center gap-2">
                    <Repeat size={16} className="text-primary-600" />
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Autopay Transactions</h3>
                </div>
                <button 
                    onClick={() => {
                        setEditingAutopay(null);
                        setIsAutopayModalOpen(true);
                    }}
                    className="text-[10px] font-bold text-primary-600 uppercase tracking-widest hover:underline"
                >
                    + Setup New
                </button>
            </div>
            <div className="">
                {autopays.filter(a => a.bookId === selectedBookId).length === 0 ? (
                    <div className="p-6 text-center">
                        <p className="text-xs text-gray-400">No autopay transactions scheduled for this book.</p>
                    </div>
                ) : (
                    autopays.filter(a => a.bookId === selectedBookId).map(ap => {
                        const cat = categories.find(c => c.id === ap.categoryId);
                        return (
                            <div key={ap.id} className="p-4 flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${cat?.color || 'bg-gray-500'} bg-opacity-10 text-current`}>
                                        <Repeat size={14} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{cat?.name}</p>
                                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${ap.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {ap.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-[10px] text-gray-500">
                                                {ap.frequency} • {maskMoney(ap.amount, currencySymbol)}
                                            </p>
                                            {ap.tags && ap.tags.length > 0 && (
                                              <div className="flex flex-wrap gap-1">
                                                {ap.tags.slice(0, 2).map(tag => (
                                                  <span key={tag} className="text-[7px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-1 py-0.5 rounded uppercase font-bold tracking-tighter max-w-[60px] truncate">
                                                    {tag}
                                                  </span>
                                                ))}
                                                {ap.tags.length > 2 && (
                                                  <span className="text-[7px] bg-primary-50 dark:bg-primary-900/20 text-primary-600 px-1 py-0.5 rounded uppercase font-bold tracking-tighter">
                                                    +{ap.tags.length - 2} more
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={() => {
                                            setEditingAutopay(ap);
                                            setIsAutopayModalOpen(true);
                                        }}
                                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button 
                                        onClick={() => toggleAutopayStatus(ap.id)}
                                        className={`p-2 rounded-lg transition-colors ${ap.status === 'ACTIVE' ? 'text-amber-500 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                                        title={ap.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                                    >
                                        {ap.status === 'ACTIVE' ? <Pause size={16} /> : <Play size={16} />}
                                    </button>
                                    <button 
                                        onClick={() => {
                                            deleteAutopay(ap.id);
                                            showToast("Autopay deleted", "info");
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>

        {/* Edit Book Form (Inline if editing active while in detail view) */}
        {isBookFormOpen && editingBookId === selectedBookId && (
            <div className="mb-6 p-4 bg-white dark:bg-cardbg rounded-xl border border-primary-200 dark:border-primary-900">
                 <h3 className="font-semibold mb-3 dark:text-white">Edit Book Details</h3>
                 <form onSubmit={handleBookSubmit} className="space-y-3">
                     <input 
                        type="text" 
                        value={bookName}
                        onChange={e => setBookName(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2 dark:text-white"
                     />
                     <div className="relative">
                        <select 
                            value={bookCurrency}
                            onChange={e => setBookCurrency(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2 dark:text-white appearance-none"
                        >
                            {CURRENCIES.map(c => (
                                <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                            ))}
                        </select>
                     </div>
                     <div className="flex gap-2">
                         <button type="button" onClick={() => setIsBookFormOpen(false)} className="flex-1 py-2 text-sm text-gray-500">Cancel</button>
                         <button type="submit" className="flex-1 py-2 text-sm bg-primary-600 text-white rounded-lg">Save Changes</button>
                     </div>
                 </form>
            </div>
        )}

        {/* Action Bar */}
        <div className="flex gap-2 mb-6">
           {!isAddTxOpen && (
             <button 
               onClick={() => { setEditingTransaction(null); setIsAddTxOpen(true); }}
               className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
             >
               <Plus size={20} /> Add Expense / Income
             </button>
           )}
        </div>

        {/* Transaction Modal */}
        <TransactionModal 
          isOpen={isAddTxOpen}
          onClose={() => {
            setIsAddTxOpen(false);
            setEditingTransaction(null);
          }} 
          preSelectedBookId={selectedBookId}
          editTransaction={editingTransaction}
          title={editingTransaction ? "Edit Transaction" : "New Transaction"}
        />

        <AutopayModal 
          isOpen={isAutopayModalOpen}
          onClose={() => {
            setIsAutopayModalOpen(false);
            setEditingAutopay(null);
          }}
          bookId={selectedBookId}
          editAutopay={editingAutopay}
        />

        {/* List */}
        <div className="bg-white dark:bg-cardbg rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
           <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Transactions</h3>
                 {selectedTxIds.size > 0 && (
                   <span className="text-[10px] bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full font-bold">
                     {selectedTxIds.size} Selected
                   </span>
                 )}
              </div>
              <div className="flex items-center gap-2">
                 {isMultiSelectMode ? (
                   <>
                     {selectedTxIds.size > 0 && (
                       <button 
                         onClick={handleBulkDelete}
                         className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline flex items-center gap-1"
                       >
                         <Trash2 size={12} /> Delete
                       </button>
                     )}
                     <button 
                        onClick={() => {
                          setIsMultiSelectMode(false);
                          setSelectedTxIds(new Set());
                        }}
                        className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:underline"
                     >
                        Cancel
                     </button>
                   </>
                 ) : (
                   bookTransactions.length > 0 && (
                     <button 
                        onClick={() => setIsMultiSelectMode(true)}
                        className="text-[10px] font-bold text-primary-600 uppercase tracking-widest hover:underline"
                     >
                        Manage
                     </button>
                   )
                 )}
              </div>
           </div>

           <div className="">
              {bookTransactions.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                     <FolderOpen size={32} className="mx-auto mb-2 opacity-20" />
                     <p className="text-sm">No transactions in this book yet.</p>
                  </div>
              ) : (
                Object.entries(groupedTransactions)
                  .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                  .map(([date, groupTransactions]) => {
                  const groupDate = new Date(date);
                  return (
                    <div key={date}>
                      <div className="px-5 pt-4 pb-1 flex items-center">
                         <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                           {groupDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                         </span>
                      </div>
                      <div className="">
                        {groupTransactions.map(tx => {
                          const cat = categories.find(c => c.id === tx.categoryId);
                          const isSelected = selectedTxIds.has(tx.id);
                          
                          const renderIcon = (iconName: string) => {
                            try {
                              const LucideIcon = (Icons as any)[iconName] || CircleHelp;
                              return <LucideIcon size={16} className={cat?.color?.replace('bg-', 'text-')} />;
                            } catch (e) {
                              return <CircleHelp size={16} className={cat?.color?.replace('bg-', 'text-')} />;
                            }
                          };
                          
                          return (
                             <div 
                               key={tx.id} 
                               onClick={() => isMultiSelectMode && handleToggleSelectTx(tx.id)}
                               className={`p-4 flex justify-between items-center group transition-colors cursor-pointer ${isSelected ? 'bg-primary-50/50 dark:bg-primary-900/10' : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/30'}`}
                             >
                                 <div className="flex items-center gap-3">
                                     {isMultiSelectMode && (
                                       <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary-600 border-primary-600' : 'border-gray-300 dark:border-gray-700'}`}>
                                         {isSelected && <Icons.Check size={12} className="text-white" />}
                                       </div>
                                     )}
                                     <div className={`p-2 rounded-xl ${cat?.color || 'bg-gray-500'} bg-opacity-10 dark:bg-opacity-20 text-current`}>
                                         {renderIcon(cat?.icon || '')}
                                     </div>
                                     <div>
                                         <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">{cat?.name}</p>
                                         <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-[10px] text-gray-500">
                                              {tx.time || (tx.date ? new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '00:00')}
                                              {tx.note && ` • ${tx.note.length > 20 ? tx.note.substring(0, 20) + '...' : tx.note}`}
                                            </p>
                                            {tx.tags && tx.tags.length > 0 && (
                                              <div className="flex flex-wrap gap-1">
                                                {tx.tags.slice(0, 2).map(tag => (
                                                  <span key={tag} className="text-[7px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-1 py-0.5 rounded uppercase font-bold tracking-tighter max-w-[60px] truncate">
                                                    {tag}
                                                  </span>
                                                ))}
                                                {tx.tags.length > 2 && (
                                                  <span className="text-[7px] bg-primary-50 dark:bg-primary-900/20 text-primary-600 px-1 py-0.5 rounded uppercase font-bold tracking-tighter">
                                                    +{tx.tags.length - 2} more
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                         </div>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-1">
                                     <span className={`text-xs font-bold ${tx.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-500 dark:text-red-400'}`}>
                                         {tx.type === TransactionType.INCOME ? '+' : '-'}
                                         {maskMoney(tx.amount, currencySymbol)}
                                     </span>
                                     {!isMultiSelectMode && (
                                       <div className="flex items-center ml-3 gap-2">
                                         {confirmDeleteTxId === tx.id ? (
                                           <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
                                             <button 
                                               onClick={(e) => {
                                                 e.stopPropagation();
                                                 deleteTransaction(tx.id);
                                                 setConfirmDeleteTxId(null);
                                                 showToast("Transaction deleted", "info");
                                               }}
                                               className="p-1 px-2 bg-red-500 text-white text-[10px] font-bold rounded-lg uppercase"
                                             >
                                               Delete
                                             </button>
                                             <button 
                                               onClick={(e) => {
                                                 e.stopPropagation();
                                                 setConfirmDeleteTxId(null);
                                               }}
                                               className="p-1 px-2 bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] font-bold rounded-lg uppercase"
                                             >
                                               No
                                             </button>
                                           </div>
                                         ) : (
                                           <>
                                             <button 
                                                 onClick={(e) => {
                                                   e.stopPropagation();
                                                   handleEditTransaction(tx);
                                                 }}
                                                 className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors"
                                                 title="Edit"
                                             >
                                                 <Pencil size={14} />
                                             </button>
                                             <button 
                                                 onClick={(e) => {
                                                   e.stopPropagation();
                                                   setConfirmDeleteTxId(tx.id);
                                                 }}
                                                 className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                                 title="Delete"
                                             >
                                                 <Trash2 size={14} />
                                             </button>
                                           </>
                                         )}
                                       </div>
                                     )}
                                 </div>
                             </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
           </div>

           {allBookTransactions.length > visibleCount && (
             <div className="p-4 border-t border-gray-50 dark:border-gray-800 flex justify-center bg-gray-50/30 dark:bg-gray-800/20">
                <button 
                   onClick={() => setVisibleCount(prev => prev + 30)}
                   className="text-[10px] font-bold text-primary-600 uppercase tracking-widest hover:underline flex items-center gap-2"
                >
                   Load More (+30)
                </button>
             </div>
           )}
        </div>

        {/* Delete Book Section */}
        <div className="mt-10 pt-6">
             {!showDeleteConfirm ? (
                 <div className="flex justify-center">
                    <button 
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-red-500 text-xs hover:bg-red-50 dark:hover:bg-red-900/10 px-4 py-2 rounded-xl transition-all font-bold uppercase tracking-widest flex items-center gap-2"
                    >
                        <Trash2 size={14} /> Delete this Book
                    </button>
                 </div>
             ) : (
                 <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-2xl border border-red-100 dark:border-red-900/50 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold uppercase tracking-widest text-xs mb-3">
                        <AlertCircle size={16} />
                        <span>Danger Zone</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-5 leading-relaxed">
                        Are you sure you want to delete <b>{selectedBook.name}</b>? This will permanently remove all <b>{bookTransactions.length}</b> transactions.
                    </p>
                    <div className="flex gap-3">
                        <button 
                           onClick={() => setShowDeleteConfirm(false)}
                           className="flex-1 py-3 bg-white dark:bg-cardbg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button 
                           onClick={handleDeleteBook}
                           className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-500/30 hover:bg-red-700 transition-all active:scale-95"
                        >
                            Confirm Delete
                        </button>
                    </div>
                 </div>
             )}
        </div>

      </div>
    );
  }

  // All Books List
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center py-2">
         <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">My Books</h2>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-widest">Manage your folders</p>
         </div>
         <button 
           onClick={() => openBookForm()}
           className="p-3 bg-primary-600 text-white rounded-2xl shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-90"
         >
           <Plus size={24} />
         </button>
      </div>

      {isBookFormOpen && !selectedBookId && (
          <div className="bg-white dark:bg-cardbg p-6 rounded-2xl shadow-xl border border-primary-100 dark:border-primary-900 animate-in fade-in slide-in-from-top-2">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-4">Create New Book</h3>
              <form onSubmit={handleBookSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Book Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Personal, Business" 
                      value={bookName}
                      onChange={e => setBookName(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all"
                      autoFocus
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Currency</label>
                    <div className="relative">
                        <select 
                           value={bookCurrency}
                           onChange={e => setBookCurrency(e.target.value)}
                           className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 dark:text-white appearance-none focus:ring-2 focus:ring-primary-500 transition-all"
                        >
                            {CURRENCIES.map(c => (
                                <option key={c.code} value={c.code}>
                                    {c.flag} {c.code} - {c.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                           <Icons.ChevronDown size={16} />
                        </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                      <button 
                        type="button" 
                        onClick={() => setIsBookFormOpen(false)} 
                        className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all active:scale-95"
                      >
                        Create Book
                      </button>
                  </div>
              </form>
          </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {myBooks.map(book => {
            const balance = transactions
                .filter(t => t.bookId === book.id)
                .reduce((acc, t) => t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount, 0);

            const symbol = CURRENCIES.find(c => c.code === book.currency)?.symbol || '₹';

            return (
                <button 
                    key={book.id}
                    onClick={() => {
                        setSelectedBookId(book.id);
                        setSearchParams({ id: book.id });
                    }}
                    className="bg-white dark:bg-cardbg p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-primary-100 dark:hover:border-primary-900 transition-all text-left group relative overflow-hidden flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${book.color || 'bg-primary-500'} bg-opacity-10 text-primary-600 dark:text-primary-400`}>
                            <FolderOpen size={18} />
                        </div>
                        <h3 className="text-base text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors tracking-tight truncate max-w-[150px]">{book.name}</h3>
                    </div>
                    <span className={`text-sm ${balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {maskMoney(balance, symbol)}
                    </span>
                    {/* Subtle accent */}
                    <div className="absolute top-0 right-0 w-1 h-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
            );
        })}
      </div>
    </div>
  );
};

export default Books;