import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { Plus, Wallet, TrendingUp, TrendingDown, ArrowRight, Eye, EyeOff, Pencil, FolderOpen } from 'lucide-react';
import TransactionModal from '../components/TransactionModal';
import { TransactionType, Transaction } from '../types';
import { CURRENCIES } from '../constants';
import { formatIndianCurrency } from '../utils/format';
import { Link, useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const { currentProfile, books, transactions, categories, togglePrivacyMode } = useData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Derive data
  const profileBookIds = useMemo(() => 
    books.filter(b => b.profileId === currentProfile?.id).map(b => b.id), 
    [books, currentProfile]
  );

  const selectedBookIds = useMemo(() => 
    currentProfile?.selectedBookIds || [],
    [currentProfile]
  );

  const profileTransactions = useMemo(() => 
    transactions
      .filter(t => profileBookIds.includes(t.bookId))
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      }),
    [transactions, profileBookIds]
  );

  const filteredTransactions = useMemo(() => 
    profileTransactions.filter(t => selectedBookIds.includes(t.bookId)),
    [profileTransactions, selectedBookIds]
  );

  const totalIncome = useMemo(() => 
    filteredTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
    [filteredTransactions]
  );

  const totalExpense = useMemo(() => 
    filteredTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
    [filteredTransactions]
  );

  const getBook = (id: string) => books.find(b => b.id === id);
  const getCatName = (id: string) => categories.find(c => c.id === id)?.name || 'Other';

  const handleQuickAdd = () => {
    if(profileBookIds.length === 0) {
      showToast("Please create a book first to add transactions.", "error");
      return;
    }
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const isPrivacy = currentProfile?.isPrivacyMode;
  // Use Global Currency for total, or fall back to '₹'
  const globalSymbol = CURRENCIES.find(c => c.code === currentProfile?.currency)?.symbol || '₹';

  const maskMoney = (amount: number, symbol: string = globalSymbol) => 
    isPrivacy ? '****' : formatIndianCurrency(amount, symbol);

  const getBookBalance = (bookId: string) => {
    return transactions
      .filter(t => t.bookId === bookId)
      .reduce((acc, t) => t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount, 0);
  };

  const myBooks = useMemo(() => 
    books.filter(b => b.profileId === currentProfile?.id),
    [books, currentProfile]
  );

  return (
    <div className="space-y-4 max-w-4xl mx-auto px-2 pb-20">
      {/* Total Balance Tile */}
      <div className="bg-white dark:bg-cardbg p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Balance</h2>
            <button onClick={togglePrivacyMode} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400">
              {isPrivacy ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <button 
            onClick={handleQuickAdd}
            className="p-3 bg-primary-600 text-white rounded-2xl shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-90"
            title="Quick Add"
          >
            <Plus size={24} />
          </button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {selectedBookIds.length === 0 ? (
            <span className="text-lg text-gray-400 font-medium tracking-normal">No books selected</span>
          ) : (
            isPrivacy ? '****' : formatIndianCurrency(totalIncome - totalExpense, globalSymbol)
          )}
        </h1>
        {/* Subtle background decoration */}
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl"></div>
      </div>

      {/* Transaction Modal */}
      <TransactionModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }} 
        editTransaction={editingTransaction}
        title={editingTransaction ? "Edit Transaction" : "Quick Add"}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-cardbg p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
            <TrendingUp size={16} />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-tighter">Income</span>
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
              {maskMoney(totalIncome)}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-cardbg p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
            <TrendingDown size={16} />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-tighter">Expenses</span>
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
              {maskMoney(totalExpense)}
            </p>
          </div>
        </div>
      </div>

      {/* Books Tile */}
      <div className="bg-white dark:bg-cardbg p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">My Books</h3>
          <Link to="/books" className="text-xs text-primary-600 hover:underline">Manage</Link>
        </div>
        <div className="space-y-2">
          {myBooks.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">No books created yet.</p>
          ) : (
            myBooks.slice(0, 3).map(book => {
              const balance = getBookBalance(book.id);
              const symbol = CURRENCIES.find(c => c.code === book.currency)?.symbol || '₹';
              return (
                <button 
                  key={book.id}
                  onClick={() => navigate(`/books?id=${book.id}`)}
                  className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${book.color} bg-opacity-10 text-primary-600 dark:text-primary-400`}>
                      <FolderOpen size={14} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600">{book.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {maskMoney(balance, symbol)}
                  </span>
                </button>
              );
            })
          )}
          {myBooks.length > 3 && (
            <button onClick={() => navigate('/books')} className="w-full text-center text-[10px] text-gray-400 hover:text-primary-500 pt-1">
              + {myBooks.length - 3} more books
            </button>
          )}
        </div>
      </div>

      {/* Recent Transactions Tile */}
      <div className="bg-white dark:bg-cardbg p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-3">
           <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Recent Transactions</h3>
           {profileTransactions.length > 5 && (
             <button onClick={() => navigate('/books')} className="text-xs text-primary-600 hover:underline">
               View All
             </button>
           )}
        </div>
        
        <div className="space-y-1">
           {profileTransactions.length === 0 ? (
             <div className="py-4 text-center text-xs text-gray-400">No transactions yet.</div>
           ) : (
             <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
               {profileTransactions.slice(0, 5).map(tx => {
                 const dateObj = new Date(tx.date || Date.now());
                 const book = getBook(tx.bookId);
                 const symbol = CURRENCIES.find(c => c.code === book?.currency)?.symbol || '₹';
                 const formattedDate = dateObj.toLocaleDateString(undefined, { 
                   month: 'short', 
                   day: 'numeric', 
                   year: 'numeric' 
                 });
                 
                 const truncatedBookName = book?.name 
                   ? (book.name.length > 15 ? book.name.substring(0, 15) + '...' : book.name)
                   : 'Unknown';

                 return (
                 <div key={tx.id} className="py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group px-1 rounded-md">
                    <div className="flex items-center gap-2.5">
                       <div className={`w-7 h-7 rounded-full flex items-center justify-center ${tx.type === TransactionType.INCOME ? 'bg-green-100 text-green-600 dark:bg-green-900/20' : 'bg-red-100 text-red-600 dark:bg-red-900/20'}`}>
                          <Wallet size={14} />
                       </div>
                       <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100 leading-none mb-0.5">{getCatName(tx.categoryId)}</p>
                          <p className="text-[10px] text-gray-500 truncate">
                             {truncatedBookName} • {formattedDate}
                          </p>
                       </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className={`text-xs ${tx.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-500 dark:text-red-400'}`}>
                           {tx.type === TransactionType.INCOME ? '+' : '-'}
                           {maskMoney(tx.amount, symbol)}
                        </span>
                        <button 
                          onClick={() => handleEditTransaction(tx)}
                          className="p-1 text-gray-400 hover:text-primary-600 transition-colors -mr-1"
                        >
                            <Pencil size={12} />
                        </button>
                    </div>
                 </div>
               )})}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Home;