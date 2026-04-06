import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { Plus, FolderOpen, ArrowLeft, Trash2, AlertTriangle, Pencil } from 'lucide-react';
import TransactionModal from '../components/TransactionModal';
import { TransactionType, Transaction } from '../types';
import { CURRENCIES } from '../constants';

const Books: React.FC = () => {
  const { currentProfile, books, transactions, addBook, updateBook, deleteBook, deleteTransaction, categories } = useData();
  const { showToast } = useToast();
  
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  
  // Modal States
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Book Form State (Create & Edit)
  const [isBookFormOpen, setIsBookFormOpen] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null); // If set, we are editing
  const [bookName, setBookName] = useState('');
  const [bookCurrency, setBookCurrency] = useState('USD');

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
         setBookCurrency('USD');
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
  const bookTransactions = transactions
    .filter(t => t.bookId === selectedBookId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Reset delete confirm state when switching books or closing detail view
  const handleBack = () => {
    setSelectedBookId(null);
    setShowDeleteConfirm(false);
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

    const currencySymbol = CURRENCIES.find(c => c.code === selectedBook.currency)?.symbol || '$';

    return (
      <div className="animate-fade-in pb-10">
        <div className="flex items-center gap-2 mb-6">
          <button 
            onClick={handleBack} 
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
          </button>
          
          <div className="flex-1">
             <div className="flex items-center gap-2">
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedBook.name}</h2>
                 <button 
                    onClick={() => openBookForm(selectedBook)}
                    className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                 >
                     <Pencil size={16} />
                 </button>
             </div>
          </div>

          <span className="text-sm font-bold px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300">
             {selectedBook.currency} {total.toFixed(2)}
          </span>
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
           <button 
             onClick={() => { setEditingTransaction(null); setIsAddTxOpen(true); }}
             className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm"
           >
             <Plus size={20} /> Add Expense / Income
           </button>
        </div>

        {/* List */}
        <div className="space-y-3">
           {bookTransactions.length === 0 ? (
               <div className="text-center py-10 text-gray-400 bg-white dark:bg-cardbg rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                  No transactions in this book yet.
               </div>
           ) : (
               bookTransactions.map(tx => {
                 const cat = categories.find(c => c.id === tx.categoryId);
                 const dateObj = new Date(tx.date);
                 return (
                    <div key={tx.id} className="bg-white dark:bg-cardbg p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center group">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${cat?.color} bg-opacity-10 dark:bg-opacity-20`}>
                                <div className="w-4 h-4 rounded-full bg-current opacity-50"></div>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{cat?.name}</p>
                                <p className="text-xs text-gray-500">
                                  {dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  {tx.note && ` • ${tx.note}`}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`font-bold mr-2 ${tx.type === TransactionType.INCOME ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                                {tx.type === TransactionType.INCOME ? '+' : '-'}{currencySymbol}{tx.amount.toFixed(2)}
                            </span>
                            <button 
                                onClick={() => handleEditTransaction(tx)}
                                className="p-1.5 text-gray-400 hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Pencil size={16} />
                            </button>
                            <button 
                                onClick={() => deleteTransaction(tx.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                 );
               })
           )}
        </div>

        {/* Delete Book Section */}
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
             {!showDeleteConfirm ? (
                 <div className="flex justify-center">
                    <button 
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-red-500 text-sm hover:underline font-medium px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={16} /> Delete Book
                    </button>
                 </div>
             ) : (
                 <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/50 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold mb-2">
                        <AlertTriangle size={20} />
                        <span>Are you sure?</span>
                    </div>
                    <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4">
                        This will permanently delete this book and all <b>{bookTransactions.length}</b> transactions associated with it.
                    </p>
                    <div className="flex gap-3">
                        <button 
                           onClick={() => setShowDeleteConfirm(false)}
                           className="flex-1 py-2 bg-white dark:bg-cardbg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
                        >
                            Cancel
                        </button>
                        <button 
                           onClick={handleDeleteBook}
                           className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                        >
                            Yes, Delete
                        </button>
                    </div>
                 </div>
             )}
        </div>

        <TransactionModal 
            isOpen={isAddTxOpen} 
            onClose={() => setIsAddTxOpen(false)} 
            preSelectedBookId={selectedBookId}
            editTransaction={editingTransaction}
        />
      </div>
    );
  }

  // All Books List
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Books</h2>
         <button 
           onClick={() => openBookForm()}
           className="p-2 bg-gray-100 dark:bg-gray-800 text-primary-600 rounded-full hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors"
         >
           <Plus size={24} />
         </button>
      </div>

      {isBookFormOpen && !selectedBookId && (
          <form onSubmit={handleBookSubmit} className="bg-white dark:bg-cardbg p-4 rounded-2xl shadow-lg border border-primary-100 dark:border-primary-900 animate-in fade-in slide-in-from-top-2">
              <h3 className="font-semibold mb-3 dark:text-white">Create New Book</h3>
              <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Book Name (e.g., Business)" 
                    value={bookName}
                    onChange={e => setBookName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2 dark:text-white focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                  
                  <div className="relative">
                      <select 
                         value={bookCurrency}
                         onChange={e => setBookCurrency(e.target.value)}
                         className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2 dark:text-white appearance-none"
                      >
                          {CURRENCIES.map(c => (
                              <option key={c.code} value={c.code}>
                                  {c.flag} {c.code} - {c.name}
                              </option>
                          ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                  </div>

                  <div className="flex gap-2 pt-2">
                      <button type="button" onClick={() => setIsBookFormOpen(false)} className="flex-1 py-2 text-gray-500 hover:bg-gray-50 rounded-lg">Cancel</button>
                      <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Create</button>
                  </div>
              </div>
          </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {myBooks.map(book => {
            const balance = transactions
                .filter(t => t.bookId === book.id)
                .reduce((acc, t) => t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount, 0);

            const symbol = CURRENCIES.find(c => c.code === book.currency)?.symbol || '$';

            return (
                <button 
                    key={book.id}
                    onClick={() => setSelectedBookId(book.id)}
                    className="bg-white dark:bg-cardbg p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow text-left group relative"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${book.color} bg-opacity-10 text-primary-600 dark:text-primary-400`}>
                            <FolderOpen size={24} />
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300">
                            {book.currency}
                        </span>
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{book.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Balance: {symbol}{balance.toFixed(2)}</p>
                </button>
            );
        })}
      </div>
    </div>
  );
};

export default Books;