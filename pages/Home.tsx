import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { Plus, Wallet, TrendingUp, TrendingDown, ArrowRight, Eye, EyeOff, Pencil } from 'lucide-react';
import TransactionModal from '../components/TransactionModal';
import { TransactionType, Transaction } from '../types';
import { CURRENCIES } from '../constants';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';

const Home: React.FC = () => {
  const { currentProfile, books, transactions, categories, togglePrivacyMode } = useData();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Derive data
  const profileBookIds = useMemo(() => 
    books.filter(b => b.profileId === currentProfile?.id).map(b => b.id), 
    [books, currentProfile]
  );

  const profileTransactions = useMemo(() => 
    transactions
      .filter(t => profileBookIds.includes(t.bookId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions, profileBookIds]
  );

  const totalIncome = useMemo(() => 
    profileTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0),
    [profileTransactions]
  );

  const totalExpense = useMemo(() => 
    profileTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0),
    [profileTransactions]
  );

  // Data for Charts
  const pieData = useMemo(() => {
    const data: {[key: string]: number} = {};
    profileTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .forEach(t => {
        const catName = categories.find(c => c.id === t.categoryId)?.name || 'Other';
        data[catName] = (data[catName] || 0) + t.amount;
      });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [profileTransactions, categories]);

  const barData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
        const dayTxs = profileTransactions.filter(t => t.date.startsWith(date));
        return {
            date: new Date(date).toLocaleDateString(undefined, {weekday: 'short'}),
            income: dayTxs.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0),
            expense: dayTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0)
        };
    });
  }, [profileTransactions]);

  const COLORS = ['#0ea5e9', '#ef4444', '#eab308', '#22c55e', '#a855f7', '#ec4899', '#64748b'];
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
    isPrivacy ? '****' : `${symbol}${amount.toFixed(2)}`;

  return (
    <div className="space-y-6">
      {/* 1-Stop Add Action */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-lg shadow-primary-500/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-1">
             <p className="text-primary-100 text-sm font-medium">Total Balance</p>
             <button onClick={togglePrivacyMode} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                 {isPrivacy ? <EyeOff size={20} /> : <Eye size={20} />}
             </button>
          </div>
          <h2 className="text-3xl font-bold mb-6">
             {isPrivacy ? '****' : `${globalSymbol}${(totalIncome - totalExpense).toFixed(2)}`}
          </h2>
          
          <button 
            onClick={handleQuickAdd}
            className="bg-white text-primary-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-xl flex items-center gap-2 transition-transform active:scale-95 shadow-sm"
          >
            <Plus size={20} />
            Quick Add
          </button>
        </div>
        
        {/* Decorative Circle */}
        <div className="absolute -right-10 -bottom-16 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-cardbg p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
              <TrendingUp size={18} />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Income</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {maskMoney(totalIncome)}
          </p>
        </div>
        <div className="bg-white dark:bg-cardbg p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-2">
             <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
              <TrendingDown size={18} />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Expenses</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {maskMoney(totalExpense)}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bar Chart - Daily Trends */}
          <div className="bg-white dark:bg-cardbg p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
             <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Last 7 Days</h3>
             <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="date" fontSize={12} stroke="#888" />
                    <YAxis fontSize={12} stroke="#888" hide={isPrivacy} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                        formatter={(value: number) => isPrivacy ? '****' : value}
                    />
                    <Legend />
                    <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} name="Income" />
                    <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>

          {/* Pie Chart - Categories */}
          {pieData.length > 0 && (
             <div className="bg-white dark:bg-cardbg p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Spending by Category</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                        formatter={(value: number) => isPrivacy ? '****' : value}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
             </div>
          )}
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-end mb-3 px-1">
           <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Recent Transactions</h3>
        </div>
        <div className="bg-white dark:bg-cardbg rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
           {profileTransactions.length === 0 ? (
             <div className="p-8 text-center text-gray-400">No transactions yet.</div>
           ) : (
             <div className="divide-y divide-gray-100 dark:divide-gray-800">
               {profileTransactions.slice(0, 5).map(tx => {
                 const dateObj = new Date(tx.date);
                 const book = getBook(tx.bookId);
                 // Individual transaction still shows its book currency for accuracy
                 const symbol = CURRENCIES.find(c => c.code === book?.currency)?.symbol || '₹';
                 
                 return (
                 <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === TransactionType.INCOME ? 'bg-green-100 text-green-600 dark:bg-green-900/20' : 'bg-red-100 text-red-600 dark:bg-red-900/20'}`}>
                          <Wallet size={18} />
                       </div>
                       <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{getCatName(tx.categoryId)}</p>
                          <p className="text-xs text-gray-500">
                             {book?.name || 'Unknown'} • {dateObj.toLocaleDateString()}
                          </p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`font-bold ${tx.type === TransactionType.INCOME ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                           {tx.type === TransactionType.INCOME ? '+' : '-'}
                           {maskMoney(tx.amount, symbol)}
                        </span>
                        <button 
                          onClick={() => handleEditTransaction(tx)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                            <Pencil size={14} />
                        </button>
                    </div>
                 </div>
               )})}
             </div>
           )}
           {profileTransactions.length > 5 && (
             <div className="p-3 text-center border-t border-gray-100 dark:border-gray-800">
                <button className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1 w-full">
                  View All <ArrowRight size={14} />
                </button>
             </div>
           )}
        </div>
      </div>

      <TransactionModal 
         isOpen={isModalOpen} 
         onClose={() => setIsModalOpen(false)} 
         editTransaction={editingTransaction}
      />
    </div>
  );
};

export default Home;